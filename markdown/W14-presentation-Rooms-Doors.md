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
### Week 14: Rooms, Doors & The Liskov Payoff
*Instructor: Mark McArthey*

---

## Recap: Where We Are

What we covered together in class:

```
W12  →  Item TPH (Weapon, Armor, Consumable, KeyItem)
        Container TPH (Inventory, Equipment)
        Items live in containers via ContainerId FK

W13  →  Container hierarchy extended (Chest as a third subclass)
        EquipmentSlot entity + SlotType enum
        Chest with IsLocked + RequiredKeyId properties
        InteractWithChest — basic locked-check flow
```

The W13 **template assignment** also introduced `ILockable`, `MonsterLoot`,
and `Player.TryUnlock` — concepts we'll meet properly tonight as the bridge
from chests to doors.

**Today: the architecture pays off.**
- `Room` becomes another Container subclass — items on the floor are just items in a container
- `Door` becomes a second `ILockable` entity — and one unlock method works on both

*Light week on scope. Heavy on the payoff.*

---

## A Quick Note on Equipment

In class last week we built `EquipmentSlot` as a **separate entity** with FKs
back to Equipment and the equipped item. The W13 template takes a simpler
path: a `SlotType` enum + a single `CanEquip()` method on Equipment.

**Both are valid.** The entity version is more flexible (slot-specific
unlocks, cosmetics, enchantments later). The enum version is less ceremony.
You'll see the enum-only approach in the W14 template; if you stuck with
your `EquipmentSlot` entity from last week, no changes needed — it works
the same way for everything we'll do tonight.

The general lesson: there's no single right shape. Promote a value to an
entity when it gains state of its own — not before.

---

## What's New This Week

| Concept | Description |
|---------|-------------|
| `Room` | Fifth Container subclass — holds items on the floor |
| `Door` | New entity — connects two rooms, can be locked/trapped/secret |
| Self-referencing FKs | `Room.NorthRoomId` points to another `Room` |
| `Player.CurrentRoomId` | Location persists in the database |
| `TryUnlock(ILockable, ...)` | Refactored to take the interface, not the concrete type |
| `Door.IsSecret` / `IsDiscovered` | New state that doesn't exist on chests |
| **Spectre.Console (intro)** | First taste of styled console output — heavy in W15 |

---

## The Big Idea: Room IS a Container

We've been building toward this since Week 12:

```csharp
public class Room : Container { ... }     // Room is a Container
```

Dropping an item on the floor is no longer a special operation:

```csharp
// Drop item from backpack onto the floor of the current room:
item.ContainerId = currentRoom.Id;
_context.SaveChanges();
```

Pick up? Same operation in reverse:
```csharp
item.ContainerId = player.Inventory.Id;
```

**One `Items` table. One `ContainerId` foreign key. Backpacks, equipment, chests, monster loot, AND room floors — all the same operation.**

---

## Adding Room to GameContext: One Line

```csharp
modelBuilder.Entity<Container>()
    .HasDiscriminator<string>(c => c.ContainerType)
    .HasValue<Inventory>("Inventory")       // W12
    .HasValue<Equipment>("Equipment")       // W12
    .HasValue<Chest>("Chest")               // W13
    .HasValue<MonsterLoot>("MonsterLoot")   // W13
    .HasValue<Room>("Room");                // NEW
```

That's the **fifth** subclass. The pattern is genuinely additive — none of W12 or W13's code needs to change.

Run this query and see for yourself:
```sql
SELECT ContainerType, COUNT(*) FROM Containers GROUP BY ContainerType
```
Five rows, one table.

---

## Door: A Different Shape

```csharp
public class Door
{
    public int Id { get; set; }
    public string Name { get; set; }

    public int RoomAId { get; set; }                // FK to Room
    public int RoomBId { get; set; }                // FK to Room

    // ILockable
    public bool IsLocked { get; set; }
    public bool IsTrapped { get; set; }
    public string? RequiredKeyId { get; set; }
    public bool IsPickable { get; set; }
    public int TrapDamage { get; set; }
    public bool TrapDisarmed { get; set; }

    // Secret doors (new state — chests don't have this)
    public bool IsSecret { get; set; }
    public bool IsDiscovered { get; set; }

    public bool IsVisible => !IsSecret || IsDiscovered;
}
```

Door is its own entity in its own `Doors` table — **not** a Container subclass.

---

## Why Isn't Door a Container?

Doors don't hold items. Forcing Door into the Container hierarchy would mean:
- An empty `Items` collection that's never used
- A discriminator value (`"Door"`) that doesn't carry container semantics
- Confusing reads: "what items are in this door?" — meaningless

Containers and Doors are **different categories of thing** that happen to share *one* trait (lockability). That trait gets factored out into `ILockable`, and each entity implements it where it makes sense.

This is **Interface Segregation** in action: separate concerns get separate interfaces. Container has `IItemContainer`. Door has `ILockable`. Chest happens to implement both.

---

## Self-Referencing Foreign Keys

Each Room can point to up to four other Rooms via cardinal exits:

```csharp
public class Room : Container
{
    public int? NorthRoomId { get; set; }
    public int? SouthRoomId { get; set; }
    public int? EastRoomId { get; set; }
    public int? WestRoomId { get; set; }

    public virtual Room? NorthRoom { get; set; }
    public virtual Room? SouthRoom { get; set; }
    public virtual Room? EastRoom { get; set; }
    public virtual Room? WestRoom { get; set; }
}
```

Configured in GameContext with `.HasOne(r => r.NorthRoom).WithMany().HasForeignKey(r => r.NorthRoomId)` — one of these per direction.

**Self-referencing FKs** are how the database models a graph (rooms connected to rooms) using a relational table.

---

## One Door, Two Rooms

A door between Room 8 and Room 10 is **one row** in the Doors table:

| Id | Name | RoomAId | RoomBId | IsLocked |
|----|------|---------|---------|----------|
| 2 | Rune-etched door | 8 | 10 | no |

When the player walks south from Room 8, the engine looks for a door matching either direction:

```csharp
var door = _doors.FirstOrDefault(d =>
    (d.RoomAId == fromId && d.RoomBId == toId) ||
    (d.RoomAId == toId && d.RoomBId == fromId));
```

**One row, both directions.** No duplication — and unlocking it once unlocks it from both sides.

---

## Meet `ILockable` — The Bridge

Last week our Chest had `IsLocked` and `RequiredKeyId` as direct properties.
That works for one entity. But Door is about to need the same properties —
and a future `LockedJournal` or `MagicPortal` will too. We don't want to
copy-paste lock state across every entity that might get locked.

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

`ILockable` describes **anything that can be locked and trapped** — without
saying *what kind of thing*. Today, Chest implements it. In the same lesson,
Door implements it. One contract, two entities, one unlock method.

---

## The Liskov Payoff: One Method, Two Entities

If `Player.TryUnlock` had been written `(Chest chest, KeyItem key)`, it
would be perfect for chests and useless for doors. Instead we write it
against the interface:

```csharp
public bool TryUnlock(ILockable target, KeyItem key) { ... }
```

The body of the method only ever reads/writes properties defined in
`ILockable` — `target.IsLocked`, `target.RequiredKeyId`, etc. It doesn't
know — and doesn't care — whether `target` is a Chest or a Door.

```csharp
player.TryUnlock(chest, dungeonKey);   // Works
player.TryUnlock(door,  cellarKey);    // ALSO WORKS — zero new code
```

---

## Inside `TryUnlock`

```csharp
public bool TryUnlock(ILockable target, KeyItem key)
{
    if (key.KeyId == null)                      // LOCKPICK branch
    {
        if (!target.IsPickable) return false;
        if (target.RequiredKeyId != null) return false;
        target.IsLocked = false;
        Inventory.RemoveItem(key);              // lockpick consumed on use
        return true;
    }

    if (key.KeyId == target.RequiredKeyId)      // SPECIFIC KEY branch
    {
        target.IsLocked = false;
        return true;                            // key NOT consumed - reusable
    }

    return false;
}
```

Two branches: lockpick (consumed, only on pickable locks with no specific
key) vs. matching key (not consumed, can reuse). The contract is `ILockable`
on both sides. **That is the Liskov Substitution Principle.**

---

## Door State: More Than Just Locked

Doors can be in combinations of three independent states:

| IsLocked | IsTrapped | IsSecret | Player experience |
|----------|-----------|----------|-------------------|
| no | no | no | Just walk through |
| **yes** | no | no | Need a key or lockpick |
| no | **yes** | no | Take damage on first crossing |
| no | no | **yes** | Hidden until Inspect Room reveals it |
| **yes** | **yes** | no | Find key AND survive trap |
| no | **yes** | **yes** | Hidden trap behind hidden door (mean!) |

`IsSecret + IsDiscovered` is W14-only state. Chests don't have it. That's fine — Door has properties Chest doesn't, even though both implement ILockable. **The interface is a contract, not a clone.**

---

## Player.CurrentRoomId: Location Persistence

```csharp
public class Player
{
    public int? CurrentRoomId { get; set; }
    public virtual Room? CurrentRoom { get; set; }
}
```

Same on Monster. The world remembers where you are.

When you save and re-launch the game, you're back in the room where you stopped. The data model carries the entire game state. No save files, no JSON, no special "checkpoint" code — just `_context.SaveChanges()` after each move.

Eager-load it cleanly:
```csharp
var player = _context.Players
    .Include(p => p.CurrentRoom!).ThenInclude(r => r.Items)
    .FirstOrDefault();
```

---

## Spectre.Console: A Small Taste

Open `Services/GameEngine.cs` and look at `PrintRoomHeader`:

```csharp
var panel = new Panel($"[green]HP:[/] {_player.Health}")
{
    Header = new PanelHeader($"[yellow bold]{room.Name}[/]"),
    Border = BoxBorder.Rounded,
    Padding = new Padding(1, 0, 1, 0)
};
AnsiConsole.Write(panel);
```

That's a styled bordered box with markup tags. Two rules:

- `[color]text[/]` for inline color (`yellow`, `green`, `bold`, etc.)
- Literal brackets need to be doubled: `[[ ]]` or escaped via `Markup.Escape()`

W15 uses Spectre heavily — split panels, ASCII maps, selection prompts. We're introducing it here so the jump isn't sudden. **The rest of W14 still uses plain `Console.WriteLine`.**

---

## The Seeded Dungeon

```
                       ┌──────────────┐
                       │ Hidden Shrine│   (north, secret door)
                       │    (Id 12)   │
                       └──────┬───────┘
                              │
                      [HIDDEN PANEL — secret]
                              │
  ┌──────────────┐     ┌──────┴───────┐     ┌──────────────┐
  │Locked Cellar │─────┤Entrance Hall ├─────┤North Chamber │
  │   (Id 11)    │     │    (Id 8)    │     │   (Id 9)     │
  └──────────────┘     └──────┬───────┘     └──────────────┘
       (west)                 │                 (east)
  [HEAVY IRON DOOR]    [RUNE-ETCHED DOOR]    [STONE ARCHWAY]
     requires              trapped                open
    "cellar-key"       (12 damage once)
                              │
                       ┌──────┴───────┐
                       │ Trapped Vault│
                       │   (Id 10)    │
                       │  + Grubnak   │
                       └──────────────┘
```

**Start in Entrance Hall.** Slim Lockpick on the floor. North Chamber has a Cellar Key. South door is trapped (12 damage, once). Hidden Shrine to the north — find it with Inspect.

---

## LINQ Patterns This Week

```csharp
// Every room in the world (TPH filter)
var rooms = _context.Containers.OfType<Room>().ToList();

// Items on the floor of the current room
var floorItems = currentRoom.Items.ToList();

// Find any Door touching the current room
var exits = _doors.Where(d =>
    d.RoomAId == currentRoom.Id || d.RoomBId == currentRoom.Id);

// Filter to visible doors only (hide undiscovered secret doors)
var visible = exits.Where(d => d.IsVisible);

// Find every KeyItem with a specific KeyId AND where it lives
var matches = _context.Items
    .OfType<KeyItem>()
    .Include(i => i.Container)
    .Where(k => k.KeyId == requiredKeyId)
    .ToList();
```

`OfType<Room>()` for the container hierarchy. `Include(...)` for eager-loading the container an item lives in. Same toolkit as W12/W13, applied to the world.

---

## Your Assignment

### Task 4: `ShowAllRooms()` (20 pts)

LINQ method that lists every room in the world, sorted by name:

```
Dungeon map:
  Entrance Hall   (items: 1, exits: 3)  <-- YOU ARE HERE
  Hidden Shrine   (items: 1, exits: 0)  [UNDISCOVERED]
  Locked Cellar   (items: 1, exits: 1)
  North Chamber   (items: 2, exits: 1)
  Trapped Vault   (items: 1, exits: 1)
```

Operators: `OrderBy`, conditional projection for the marker, `room.Items.Count`, and `CollectVisibleExits(room).Count` (helper already in `GameEngine`).

### Task 5: `FindKeyLocation(string requiredKeyId)` (15 pts)

When a door rejects you with `RequiredKeyId = "cellar-key"`, query the world for that key and tell the player where it is:

```csharp
_context.Items.OfType<KeyItem>()
    .Include(i => i.Container)
    .Where(k => k.KeyId == requiredKeyId)
    ...
```

Output: *"The Cellar Key is on the floor of the North Chamber."* — a real "hint" feature built from EF Core eager-loading.

---

## Stretch Goal (+10%): Secret Door Discovery

`Player.InspectForSecretDoors(IEnumerable<Door>)` is **already built**. Your job is to wire it in:

1. Add menu option **"Inspect the room"**
2. On selection, call `_player.InspectForSecretDoors(_doors)` then `SaveChanges()`
3. After discovery, the door becomes visible in subsequent `LookAround` calls

Bonus: chance-based — only find secret doors 50% of the time. `Random.Shared.NextDouble()`.

---

## Challenge Stretch (+5%): Merge the Unlock Helpers

Today, `GameEngine.TryUnlockChest` and `GameEngine.TryUnlockDoor` are nearly identical copy-paste twins. Replace both with:

```csharp
private void TryUnlockTarget(ILockable target)
{
    // one implementation that works for both chests AND doors
}
```

Delete the two specific helpers. If the game still works after the merge, you've truly absorbed the Liskov lesson. **One method, every lockable thing.**

This is what the SOLID principles are for: not abstract theory, but concrete code reduction. Two near-duplicate methods become one.

---

## How This Connects to W15 (Final Project)

W14 is your **last content week**. Everything is now in place:

- **W12** — Items in containers
- **W13** — Lockable containers, monster loot
- **W14** — Items live in a navigable world with doors

The W15 final layers on:
- **Spectre.Console ASCII minimap** — uses the `Room.X / Y` you already have in seed data
- **Multiple monsters** roaming between rooms
- **Expanded combat** with abilities and counterattacks
- **Richer seed world** (more rooms, more chests, more items)

Look at `w15-final/ConsoleRpg/Helpers/MapManager.cs` to see the visual map. **Nothing about the data model changes** — it's just a richer presentation of the same rooms and doors you built this week.

---

## Key Takeaways

1. **Room is a Container.** Items on the floor are items in a container. The whole world fits in one Items table.
2. **Door is NOT a Container.** Containers hold items; doors don't. Different category, separate table.
3. **ILockable proves its worth.** `TryUnlock(ILockable, KeyItem)` works on chests (W13) AND doors (W14) with zero modification. That's Liskov.
4. **Self-referencing FKs model graphs.** Rooms connect to rooms via four nullable FKs. Same pattern works for org charts, threaded comments, file trees.
5. **One door, two rooms.** A single Doors row carries both ends of a passage — and unlocking it once unlocks both sides.
6. **`OfType<T>()` keeps scaling.** Five Container subclasses now, all queryable through the same operator.

---

## References

- [EF Core Self-Referencing Relationships](https://learn.microsoft.com/en-us/ef/core/modeling/relationships/self-referencing)
- [Liskov Substitution Principle (Wikipedia)](https://en.wikipedia.org/wiki/Liskov_substitution_principle)
- [EF Core Eager Loading with Include](https://learn.microsoft.com/en-us/ef/core/querying/related-data/eager)
- [Enumerable.OfType&lt;TResult&gt;](https://learn.microsoft.com/en-us/dotnet/api/system.linq.enumerable.oftype)
- [Spectre.Console](https://spectreconsole.net/)

---
