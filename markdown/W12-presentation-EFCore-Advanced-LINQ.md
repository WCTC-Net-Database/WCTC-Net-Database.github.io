---
marp: true
theme: wctc
style: |
  section {
    font-size: 20px;
    max-height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: var(--color-background);
    border-radius: 5px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

---

![WCTC Logo](https://www.wctc.edu/Files/waukesha_logo.svg)

# .Net Database Programming (156-101)
### Week 12: Inventory & Equipment with Advanced LINQ
*Instructor: Mark McArthey*

---

## Recap: LINQ Basics

- LINQ (Language-Integrated Query) integrates querying capabilities directly into C#.
- Operators you already know:
  - `Where`: Filter sequences
  - `Select`: Project sequences into new forms
  - `OrderBy` / `OrderByDescending`: Sort data

  ```csharp
  var items = context.Items.Where(i => i.Value > 10);
  ```
  
*Today, we add more powerful operators and apply them to a real inventory system.*

---

## What's New This Week

| Concept | Why It Matters |
|---------|---------------|
| **Item TPH** | One `Items` table holds Weapons, Armor, Consumables, KeyItems |
| **Container TPH** | One `Containers` table holds Inventories and Equipment |
| **IItemContainer** | Interface every container implements |
| **OfType&lt;T&gt;()** | LINQ operator that filters a collection to a specific subtype |
| **GroupBy** | Group items by a property (type, value, weight, etc.) |
| **Seed migration** | A migration that runs a `.sql` script via `BaseMigration` |

---

## The Big Idea: Items Are Instances, Not Types

If two players both have "a sword," that's **TWO rows** in the Items table.
Same Name, same Attack, different Id, different ContainerId.

The relationship is **one-to-many**:
- A container has many items ✓
- An item has exactly **one** container at any moment ✓

**Moving an item = changing one foreign key:**
```csharp
sword.ContainerId = player.Inventory.Id;
_context.SaveChanges();
```

Contrast with Week 10: Abilities ARE types (many-to-many). Items are physical objects (one-to-many).

---

## TPH Hierarchy #1: Item

All items share **one** `Items` table with a `ItemType` discriminator column.

```
         Item (abstract base)
         ├── Weapon      (Attack, Category)
         ├── Armor       (Defense, Slot)
         ├── Consumable  (EffectType, EffectAmount, Uses)
         └── KeyItem     (KeyId)
```

In the database: Weapons have values for `Attack`, but NULLs for `Defense`, `EffectType`, etc.
That's TPH in action — one table, discriminator picks the subtype.

---

## Item Base Class

```csharp
public abstract class Item
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string ItemType { get; set; }    // TPH discriminator
    public decimal Weight { get; set; }
    public int Value { get; set; }

    // FK to the container that currently holds this item
    public int? ContainerId { get; set; }
    public Container? Container { get; set; }
}
```

Each subclass adds its own properties (e.g., `Weapon.Attack`, `Armor.Defense`).

---

## TPH Hierarchy #2: Container

Containers are places items live. Week 12 introduces two:

```
         Container (abstract base)
         ├── Inventory   (player's backpack, has MaxWeight)
         └── Equipment   (player's equipped slots)
```

Both implement `IItemContainer` — the minimal contract for holding items.

Future weeks will add more subclasses (Chest, MonsterLoot, Room) to the same table
with **zero schema changes** to existing code. That's the Open/Closed Principle payoff.

---

## IItemContainer Interface

```csharp
public interface IItemContainer
{
    ICollection<Item> Items { get; set; }
    void AddItem(Item item);
    void RemoveItem(Item item);
}
```

Every container type (Inventory, Equipment, and later Chest, Room, MonsterLoot)
implements this same interface. One API to rule them all.

---

## Configuring TPH in GameContext

```csharp
// Item hierarchy
modelBuilder.Entity<Item>()
    .HasDiscriminator<string>(i => i.ItemType)
    .HasValue<Weapon>("Weapon")
    .HasValue<Armor>("Armor")
    .HasValue<Consumable>("Consumable")
    .HasValue<KeyItem>("KeyItem");

// Container hierarchy
modelBuilder.Entity<Container>()
    .HasDiscriminator<string>(c => c.ContainerType)
    .HasValue<Inventory>("Inventory")
    .HasValue<Equipment>("Equipment");

// One-to-many: Item belongs to one Container
modelBuilder.Entity<Item>()
    .HasOne(i => i.Container)
    .WithMany(c => c.Items)
    .HasForeignKey(i => i.ContainerId);
```

---

## Player ↔ Container Relationships

The Player holds foreign keys to their Inventory and Equipment:

```csharp
public class Player
{
    public int InventoryId { get; set; }
    public Inventory Inventory { get; set; }

    public int EquipmentId { get; set; }
    public Equipment Equipment { get; set; }
}
```

Two separate containers, same Container table (TPH), same IItemContainer API.

---

## Inventory Operations: It's All FK Updates

Every inventory operation is "remove from one container, add to another":

| Action | From → To |
|--------|-----------|
| **Pick Up** | Room floor → Inventory |
| **Drop** | Inventory → Room floor |
| **Equip** | Inventory → Equipment |
| **Unequip** | Equipment → Inventory |
| **Use** | Inventory → (consumed/decremented) |

Under the hood, it's just `item.ContainerId = newContainer.Id` + `SaveChanges()`.

---

## Player Methods

```csharp
public void Equip(Item item)
{
    Inventory.RemoveItem(item);    // out of backpack
    Equipment.AddItem(item);       // into equipped slots
}

public void Unequip(Item item)
{
    Equipment.RemoveItem(item);    // off your character
    Inventory.AddItem(item);       // back into backpack
}
```

The attack/defense bonuses come from querying Equipment:
```csharp
public int GetTotalAttack() =>
    Equipment.Items.OfType<Weapon>().Sum(w => w.Attack);

public int GetTotalDefense() =>
    Equipment.Items.OfType<Armor>().Sum(a => a.Defense);
```

---

## The Star of the Show: OfType&lt;T&gt;()

`OfType<T>()` **filters AND casts** a collection to a specific subtype — in one step.

```csharp
// All weapons in the player's backpack
var weapons = player.Inventory.Items.OfType<Weapon>();

// All consumables (potions, scrolls, etc.)
var potions = player.Inventory.Items.OfType<Consumable>();

// All keys in the player's inventory
var keys = player.Inventory.Items.OfType<KeyItem>();
```

This is THE LINQ operator that makes TPH practical.
Without it, you'd be doing `Where(i => i.ItemType == "Weapon")` and casting manually.

---

## Advanced LINQ: GroupBy

Group items by a property to get breakdowns:

```csharp
var itemsByType = player.Inventory.Items
    .GroupBy(i => i.ItemType)
    .Select(g => new { Type = g.Key, Count = g.Count() })
    .ToList();

// Output:
// Weapon: 3 items
// Armor: 2 items
// Consumable: 5 items
// KeyItem: 1 item
```

**GroupBy** returns groups — each group has a `.Key` and is itself an `IEnumerable` of the matching items.

---

## Advanced LINQ: Aggregation

Perform calculations across collections:

```csharp
// Total value of everything in your backpack
var totalValue = player.Inventory.Items.Sum(i => i.Value);

// Total weight
var totalWeight = player.Inventory.Items.Sum(i => i.Weight);

// Value breakdown by item type
var valueByType = player.Inventory.Items
    .GroupBy(i => i.ItemType)
    .Select(g => new { Type = g.Key, TotalValue = g.Sum(i => i.Value) })
    .OrderByDescending(x => x.TotalValue)
    .ToList();
```

---

## Advanced LINQ: Chaining

LINQ methods chain naturally — build complex queries step by step:

```csharp
// Top 3 weapons by attack power
var topWeapons = player.Inventory.Items
    .OfType<Weapon>()
    .OrderByDescending(w => w.Attack)
    .Take(3)
    .ToList();

// All healing consumables, heaviest first
var healingPotions = player.Inventory.Items
    .OfType<Consumable>()
    .Where(c => c.EffectType == "Heal")
    .OrderByDescending(c => c.Weight)
    .ToList();
```

Read left-to-right: filter to Weapons → sort by Attack → take top 3 → execute.

---

## Seed Data: SQL Script Migrations

Week 12 introduces seed data migrations using `BaseMigration`:

```csharp
public partial class SeedInitialData : BaseMigration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        RunSql(migrationBuilder);  // loads SeedInitialData.sql
    }
}
```

The SQL script creates a starter player, their backpack, equipment container,
and a full set of items (weapons, armor, potions, a key).

Open `Migrations/Scripts/SeedInitialData.sql` to see exactly what gets seeded.

---

## Eager Loading with Include

When querying across relationships, use `Include` to pull related data:

```csharp
var player = _context.Players
    .Include(p => p.Inventory).ThenInclude(i => i.Items)
    .Include(p => p.Equipment).ThenInclude(e => e.Items)
    .FirstOrDefault();
```

Without `Include`, navigation properties are `null`.
With `Include`, EF Core eagerly loads them in a single query.

**Rule of thumb:** If you're going to read `.Items`, you need to `Include` the container first.

---

## LINQ Tips

- **Deferred execution**: LINQ queries aren't executed until iterated (`.ToList()`, `foreach`, etc.)
- **OfType&lt;T&gt;()** is your best friend for TPH — filters AND casts in one step
- **ICollection&lt;T&gt;** for navigation properties (EF Core needs `.Add()` / `.Remove()`)
- **IEnumerable&lt;T&gt;** for read-only in-memory iteration
- Use `StringComparison.OrdinalIgnoreCase` for case-insensitive search
- Call `_context.SaveChanges()` after modifying entities

---

## Your Assignment

Add two new inventory operations using advanced LINQ:

**A. "Find the strongest weapon I own"**
- Use `OfType<Weapon>()` + `OrderByDescending(w => w.Attack).First()`
- Display weapon name and Attack value
- Handle the empty case gracefully

**B. "Total value of my inventory"**
- Use `Sum(i => i.Value)` for the grand total
- Use `GroupBy` to show a breakdown by ItemType
- Wire both into the Inventory menu as new options

---

## Stretch Goal: Weight Limit Enforcement

The `Inventory.MaxWeight` property already exists, and `Player.PickUp()` already checks it.

Extend this with LINQ:
1. Display current weight as `"12.5 / 100 lbs"` in the inventory listing
2. Add "Sort by Weight" to the sort submenu
3. "Show items I could still pick up" — filter hypothetical items by remaining capacity
4. Bonus: find the heaviest combination that fits (knapsack problem)

---

## How This Connects to Future Weeks

| Week | What gets added | The Container pattern lets us... |
|------|-----------------|----------------------------------|
| **W13** | `Chest` + `MonsterLoot` as Container subclasses | Add new places-to-hold-items with ONE class + ONE migration |
| **W14** | `Room` as Container subclass + navigation | Drop items on floors, pick up from rooms — same API |

The `IItemContainer` interface you see this week is the spine of the rest of the course.
By W14, `container.AddItem(sword)` works identically whether `container` is a
backpack, chest, corpse loot bag, or room floor.

---

## Key Takeaways

1. **Items are instances, not types** — one-to-many via `ContainerId`, not many-to-many
2. **TPH gives you polymorphism in one table** — discriminator column picks the subtype
3. **OfType&lt;T&gt;() is the TPH query operator** — filter + cast in one step
4. **Moving items = changing one FK** — equip, drop, pick up are all the same operation
5. **IItemContainer means one API for every container** — and new container types require zero changes to existing code

---

## References

- [EF Core TPH Inheritance](https://learn.microsoft.com/en-us/ef/core/modeling/inheritance)
- [LINQ OfType&lt;T&gt;()](https://learn.microsoft.com/en-us/dotnet/api/system.linq.enumerable.oftype)
- [LINQ GroupBy](https://learn.microsoft.com/en-us/dotnet/csharp/linq/group-query-results)
- [EF Core Eager Loading](https://learn.microsoft.com/en-us/ef/core/querying/related-data/eager)
- [LINQ Query Syntax vs Method Syntax](https://learn.microsoft.com/en-us/dotnet/csharp/linq/)

---
