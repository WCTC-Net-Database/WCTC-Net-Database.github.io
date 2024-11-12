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
### Week 12: Advanced LINQ & Scaffolding with EF Core
*Instructor: Mark McArthey*

 ---

## Recap: LINQ Basics

- LINQ (Language-Integrated Query) integrates querying capabilities directly into C#.
- LINQ Operators:
  - `Where`: Filters sequences.
  - `Select`: Projects sequences into new forms.
  - `OrderBy`: Sorts data.
  
  **Example:**
  ```csharp
  var items = context.Items.Where(i => i.Value > 10);
  ```
  
*Today, we’ll build on this foundation to handle complex data relationships.*

---

## Advanced LINQ Operators

- **Grouping** (`GroupBy`): Group data based on keys.
- **Projection** (`SelectMany`): Flatten collections.
- **Aggregation** (`Sum`, `Average`): Perform calculations across collections.
- **Joining** (`Join`, `Include`): Combine data from multiple sources.

**Goal:** Gain mastery over complex data handling using these operators.

---

## New Entities: Inventory and Item

We’re adding an `Inventory` system for the `Player`.

**Entities:**
- **Inventory**: Holds items for the `Player`.
- **Item**: Weapons, armor, etc.

**Relationships:**
- `Player` -> `Inventory` (1-to-many).
- `Inventory` -> `Items` (many-to-many).

---

## Step 1: Scaffold Inventory and Item

### Inventory Entity:
```csharp
public class Inventory
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public Player Player { get; set; }
    public List<Item> Items { get; set; } = new();
}
```

### Item Entity:
```csharp
public class Item
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Type { get; set; }
    public int Attack { get; set; }
    public int Defense { get; set; }
    public decimal Weight { get; set; }
    public int Value { get; set; }
}
```

---

## Step 2: Configure Relationships

Set up many-to-many between `Inventory` and `Items`.

```csharp
modelBuilder.Entity<Inventory>()
    .HasMany(i => i.Items)
    .WithMany();
```

This setup allows multiple items to be added to a single inventory.

---

## Advanced LINQ Examples: Working with Inventory

### Query 1: Retrieve High-Value Items
Find items above a certain value threshold.

```csharp
var valuableItems = player.Inventory.Items
    .Where(i => i.Value > 50)
    .OrderByDescending(i => i.Value)
    .ToList();
```

**Grouping and Ordering**:
- Use LINQ to filter, sort, and retrieve items based on dynamic criteria.

---

## Query 2: Group Items by Type

```csharp
var itemsByType = player.Inventory.Items
    .GroupBy(i => i.Type)
    .Select(g => new { Type = g.Key, Count = g.Count() })
    .ToList();
```

**Explanation**:
- Groups `Items` by `Type` to show a breakdown of item categories.

---

## Query 3: Calculate Total Inventory Weight and Value

```csharp
var totalWeight = player.Inventory.Items.Sum(i => i.Weight);
var totalValue = player.Inventory.Items.Sum(i => i.Value);
```

**Usage**:
- Quickly find aggregate data, useful for implementing weight or value limits.

---

## Example: Filter Weapons by Attack Power

Retrieve weapons with an attack value greater than a set threshold.

```csharp
var strongWeapons = player.Inventory.Items
    .Where(i => i.Type == "Weapon" && i.Attack > 15)
    .ToList();
```

This query allows us to target specific item types with particular attributes.

---

## Step 3: Updating the GameContext

- Set up **GameContext** for new relationships.
- Scaffold migrations and run to update the database.

**Key Point**: Ensure relationships between `Player`, `Inventory`, and `Item` are reflected in the database schema.

---

## Adding LINQ Queries to Menu Operations

### Example: Display High-Value Items
Add a menu option to display all items with a value above a given threshold.

```csharp
Console.WriteLine("Enter minimum value:");
int minValue = int.Parse(Console.ReadLine());

var valuableItems = player.Inventory.Items
    .Where(i => i.Value > minValue)
    .ToList();
valuableItems.ForEach(i => Console.WriteLine(i.Name));
```

*Dynamic filtering using LINQ.*

---

## Working with CRUD Operations

### Adding and Removing Items in Inventory

#### Add Item to Inventory
```csharp
public void AddItemToInventory(Player player, Item item)
{
    if (player.Inventory.Items.Sum(i => i.Weight) + item.Weight <= maxWeight)
    {
        player.Inventory.Items.Add(item);
        _context.SaveChanges();
    }
}
```

#### Remove Item
```csharp
public void RemoveItemFromInventory(Player player, int itemId)
{
    var item = player.Inventory.Items.FirstOrDefault(i => i.Id == itemId);
    if (item != null)
    {
        player.Inventory.Items.Remove(item);
        _context.SaveChanges();
    }
}
```

---

## LINQ and EF Core: Tips for Advanced Queries

- **Lazy vs. Eager Loading**: Use `Include`/`ThenInclude` for eager loading when necessary.
- **Deferred Execution**: LINQ queries aren’t executed until iterated (e.g., `ToList()`).
- **Performance**: Use projections and limit query size with `Take`, `Skip`.

---

## Managing Migrations

### Running Migrations
1. Add migration with `dotnet ef migrations add <MigrationName>`
2. Update database with `dotnet ef database update`

**Common Issues**:
- Ensure `GameContext` setup properly before migration.
- Check navigation properties for circular dependencies.

---

## Stretch Goal: Implement Weight Limit on Inventory

- Use LINQ to calculate total weight.
- Restrict new item additions based on weight limit.

```csharp
var totalWeight = player.Inventory.Items.Sum(i => i.Weight);
if (totalWeight + newItem.Weight <= maxWeight)
{
    player.Inventory.Items.Add(newItem);
}
```

---

## Key Takeaways

- LINQ enables powerful data manipulation within EF Core.
- Entity relationships (many-to-many) enhance game complexity.
- Use scaffolding and migrations to streamline data model updates.

### **Remember**: LINQ is your tool for efficient querying; EF Core provides persistence.

---

## References

- [Microsoft Docs: Entity Framework Core LINQ](https://docs.microsoft.com/en-us/ef/core/querying/)
- [LINQ Documentation](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/linq/)
- [EF Core Relationships](https://docs.microsoft.com/en-us/ef/core/modeling/relationships)
- [Grouping and Aggregation in LINQ](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/linq/grouping)

---
