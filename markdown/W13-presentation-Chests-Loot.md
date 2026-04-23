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
### Week 13: Chests, Monster Loot & Container Rules
*Instructor: Mark McArthey*

---

## Recap: What W12 Gave Us

Last week we built two TPH hierarchies:

```
Item (abstract)                    Container (abstract)
├── Weapon                         ├── Inventory  (backpack, MaxWeight)
├── Armor                          └── Equipment  (equipped slots)
├── Consumable
└── KeyItem
```

- All items share ONE `Items` table (discriminator = `ItemType`)
- All containers share ONE `Containers` table (discriminator = `ContainerType`)
- Items move between containers by changing ONE foreign key: `Item.ContainerId`

*Today: we extend both hierarchies without touching anything that already works.*

---

## The Big Idea: Containers Earn Their Keep

Right now, `Inventory` and `Equipment` are essentially glorified lists. They hold items. That's it.

This week, container subclasses start enforcing **rules**:

| Container | Rule it enforces |
|-----------|------------------|
| `Equipment` | Can't equip two items in the same slot (WARM-UP) |
| `Chest` | Can't open until unlocked; trap fires once; specific key required |
| `MonsterLoot` | Can't loot until the monster is defeated |

Same `IItemContainer` interface, same TPH table, but each subclass now has its own invariants.

---

## Warm-Up: Equipment Has a Slot Rule

Look at `Models/Containers/Equipment.cs`:

```csharp
public class Equipment : Container
{
    public bool CanEquip(Item item)
    {
        if (item.EligibleSlot == null) return false;         // not equippable at all
        return !Items.Any(existing => existing.EligibleSlot == item.EligibleSlot);
    }
}
```

Two rules in one method:
1. The item must have an `EligibleSlot` (Consumables and KeyItems don't — they return `null`)
2. No other item in Equipment already occupies that slot

Equipment is a Container subclass enforcing an invariant the base class doesn't know about. Chest and MonsterLoot are the same pattern on a bigger scale.

---

## The SlotType Enum

```csharp
public enum SlotType
{
    Head, Body, Legs, Feet, Hands,
    Weapon, Shield, Ring, Accessory
}
```

### Why an enum instead of a string?
- **Compile-time safety:** typo `"head"` vs `"Head"` → doesn't compile
- **IntelliSense:** autocomplete the valid values
- **Exhaustive `switch`:** compiler warns if you add a new slot and forget to handle it

### Why introduce it in W13?
Same lesson as Chest's lock rule — subclass invariants — just smaller. It's the warm-up that makes the Chest lesson land.

---

## Entering the New Code: Chest

```csharp
public class Chest : Container, ILockable
{
    public string Description { get; set; }
    public bool IsLocked { get; set; }
    public bool IsTrapped { get; set; }
    public int TrapDamage { get; set; }
    public bool TrapDisarmed { get; set; }
    public bool IsPickable { get; set; }
    public string? RequiredKeyId { get; set; }
}
```

- Still a `Container` — it holds items via TPH
- Also implements `ILockable` — lock/trap/pick state
- Discriminator value `"Chest"` in the single `Containers` table
- No new table, no schema restructuring

---

## The ILockable Interface

```csharp
public interface ILockable
{
    bool IsLocked { get; set; }
    bool IsTrapped { get; set; }
    bool IsPickable { get; set; }
    string? RequiredKeyId { get; set; }
    int TrapDamage { get; set; }
    bool TrapDisarmed { get; set; }
}
```

Describes **anything that can be locked and trapped**.

- Chest implements it now (W13)
- Door will implement it next week (W14) — **same interface, different entity**

One unlock method (`Player.TryUnlock`) will work on both. That's the Liskov payoff you're about to see pay dividends.

---

## Interface Segregation: Two Interfaces, Not One

Why not one big `IChest` interface?

```csharp
// HYPOTHETICAL: everything bundled
public interface IChest
{
    ICollection<Item> Items { get; }      // holds items
    void AddItem(Item item);
    bool IsLocked { get; set; }           // can be locked
    bool IsTrapped { get; set; }
}
```

The problem: what about a door? A door locks but doesn't hold items. And `MonsterLoot` holds items but can't be locked ("you can't lock a corpse"). A bundled interface forces every entity to implement things that don't apply.

**Separate interfaces:** `IItemContainer` + `ILockable`. Each entity declares only the capabilities it actually has.

---

## MonsterLoot: Containers Can Be Implicit

```csharp
public class MonsterLoot : Container
{
    // No lock state - you can't lock a corpse
    // No special fields - it's just a "bag attached to a monster"
}
```

The interesting part is on the Monster side:

```csharp
public class Monster
{
    public int? LootId { get; set; }
    public virtual MonsterLoot? Loot { get; set; }
    public bool IsLooted { get; set; }
}
```

Each monster has its own private `MonsterLoot` container. Defeat the monster → the container is reachable. Loot it → `IsLooted = true` and items move to the player.

---

## GameContext: The Five-Line Extension

Here's the only change to `OnModelCreating`:

```csharp
modelBuilder.Entity<Container>()
    .HasDiscriminator<string>(c => c.ContainerType)
    .HasValue<Inventory>("Inventory")      // W12
    .HasValue<Equipment>("Equipment")      // W12
    .HasValue<Chest>("Chest")              // NEW
    .HasValue<MonsterLoot>("MonsterLoot"); // NEW
```

No changes to Inventory, Equipment, Item, or any of the W12 LINQ queries.

**This is the Open/Closed Principle:** open for extension (add new container types), closed for modification (don't touch existing rows).

---

## Player.OpenChest: Enum Return Values

```csharp
public enum OpenResult { Opened, Locked, Trapped, AlreadyOpen }

public OpenResult OpenChest(Chest chest)
{
    if (chest.IsLocked) return OpenResult.Locked;

    if (chest.IsTrapped && !chest.TrapDisarmed)
    {
        Health -= chest.TrapDamage;
        chest.TrapDisarmed = true;       // fires ONCE
        return OpenResult.Trapped;
    }

    return OpenResult.Opened;
}
```

**Why an enum and not a bool?** "Did it work?" has more than two outcomes here. A bool would need out-parameters or tuples to return the same info.

**Pattern:** use `enum` + `switch` expression in the caller when there are 3+ meaningful outcomes.

---

## Player.TryUnlock: Two Branches

```csharp
public bool TryUnlock(ILockable target, KeyItem key)
{
    if (key.KeyId == null)                          // LOCKPICK
    {
        if (!target.IsPickable) return false;
        if (target.RequiredKeyId != null) return false;
        target.IsLocked = false;
        Inventory.RemoveItem(key);                  // lockpick is consumed
        return true;
    }

    if (key.KeyId == target.RequiredKeyId)          // SPECIFIC KEY
    {
        target.IsLocked = false;
        return true;                                // key NOT consumed - reusable
    }

    return false;
}
```

Notice the parameter: `ILockable`, not `Chest`. Next week this same method unlocks **doors**.

---

## Seed Migration: Running a SQL Script

The template uses a `BaseMigration` class that runs a `.sql` script:

```csharp
public partial class SeedWorldContent : BaseMigration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        RunSql(migrationBuilder);        // loads SeedWorldContent.sql
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        RunSqlRollback(migrationBuilder);
    }
}
```

The `.sql` file lives in `Migrations/Scripts/` and is read as an embedded resource. Separates "schema change" migrations from "data change" migrations — both tracked in `__EFMigrationsHistory` the same way.

---

## The Seeded World: Four Chests + Grubnak

| Id | Description | Locked? | Trapped? | Pickable? | Key |
|----|-------------|---------|----------|-----------|-----|
| 3 | Weathered wooden | no | no | yes | — |
| 4 | Iron-banded | yes | no | yes | — |
| 5 | Ornate rune-engraved | yes | no | **no** | `dungeon-main` |
| 6 | Dusty humming | no | **yes** | — | — |

**Grubnak the Goblin** drops Goblin Cleaver, **Dungeon Key** (`KeyId = "dungeon-main"`), and Gobbo's Stew.

Fight Grubnak → loot him → get the key → unlock chest #5. That's a progression loop built entirely from seed data.

---

## LINQ: Querying TPH Subtypes

`OfType<T>()` is the MVP again:

```csharp
// All chests in the world
var chests = _context.Containers.OfType<Chest>().ToList();

// Locked chests only
var locked = chests.Where(c => c.IsLocked);

// Trapped and not yet disarmed
var dangerous = chests.Where(c => c.IsTrapped && !c.TrapDisarmed);

// All lockpicks in player's inventory (KeyItem with no specific KeyId)
var picks = player.Inventory.Items
    .OfType<KeyItem>()
    .Where(k => k.KeyId == null)
    .ToList();
```

Same hierarchy, same operators. The TPH pattern scales smoothly as you add more subtypes.

---

## LINQ: The "Richest Chest" Query

Rubric Task A — combines `Where`, nested `Sum`, and `OrderByDescending`:

```csharp
var richest = _context.Containers
    .OfType<Chest>()
    .Include(c => c.Items)
    .Where(c => c.IsLocked)
    .OrderByDescending(c => c.Items.Sum(i => i.Value))
    .FirstOrDefault();
```

Walks the chain:
1. Get every Chest (TPH filter via `OfType`)
2. Eager-load its contents (`Include`)
3. Keep only the locked ones (`Where`)
4. Sort by total contained value (nested `Sum` inside the key selector)
5. Take the top one (`FirstOrDefault`)

---

## Your Assignment

### Task A: "Most valuable unopened chest" (25 pts)
Add a new option to the Chest menu in `GameEngine` that runs the richest-chest query above. Print the description and total value.

### Task B: `DisarmTrap` method on Player (25 pts)
```csharp
public bool DisarmTrap(Chest chest, KeyItem lockpick)
{
    // Only lockpicks (KeyId == null) can disarm
    // Only trapped chests can be disarmed
    // On success: TrapDisarmed = true, remove lockpick from inventory
    // Return true on success, false otherwise
}
```

Wire it into the chest interaction so that a trapped chest offers "Disarm with lockpick?" if the player has one.

---

## Stretch Goal: Drop Tables

Right now Grubnak's loot is hardcoded in SQL. Make it data-driven:

```csharp
public class DropTable
{
    public int Id { get; set; }
    public string MonsterType { get; set; }      // "Goblin", "Troll", etc.
    public int ItemId { get; set; }
    public virtual Item Item { get; set; }
    public int DropChance { get; set; }          // 0-100
}
```

Then `Player.RollLoot(Monster m)`:
- LINQ `Where(d => d.MonsterType == m.MonsterType)`
- For each row, random roll → if under `DropChance`, instantiate a new Item and drop it into the monster's MonsterLoot
- **New Item instances each time** — "items are instances, not types"

---

## How This Connects to Next Week

| Week | Adds | Reuses |
|------|------|--------|
| **W14** | `Room` as another Container subclass, `Door` as an `ILockable` entity | Your `Player.TryUnlock(ILockable, KeyItem)` — works on doors with ZERO changes |

Next Tuesday you'll walk up to a locked door, and the same code you wrote this week for chests will pop it open. When that happens, the Liskov Substitution Principle has clicked into place: **one method, many entities, zero modifications**.

---

## Key Takeaways

1. **TPH scales additively** — new container subclasses (Chest, MonsterLoot) share the existing table and require zero changes to existing rows. That's OCP.
2. **Interface segregation beats bundling** — `IItemContainer` + `ILockable` separately let each entity declare only what it actually does. Door next week proves why this matters.
3. **Enum return values beat bool** when there are >2 outcomes. `OpenResult` is cleaner than three out-parameters.
4. **`OfType<T>()` is the TPH query operator** — filter + cast in one step. You'll use it every week for the rest of the course.
5. **Seed migrations are still migrations** — SQL scripts tracked by `__EFMigrationsHistory` the same way schema changes are.

---

## References

- [EF Core TPH Inheritance](https://learn.microsoft.com/en-us/ef/core/modeling/inheritance)
- [Enumerable.OfType&lt;TResult&gt;](https://learn.microsoft.com/en-us/dotnet/api/system.linq.enumerable.oftype)
- [C# enum with switch expression](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/switch-expression)
- [Interface Segregation Principle](https://en.wikipedia.org/wiki/Interface_segregation_principle)
- [Liskov Substitution Principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle)

---
