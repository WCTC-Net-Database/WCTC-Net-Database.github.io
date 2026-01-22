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
### Week 7: Midterm Preparation
*Instructor: Mark McArthey*

---

## What's on the Midterm?

| Concept | Where You Learned It |
|---------|---------------------|
| File I/O (JSON) | Weeks 1-4 |
| **LINQ queries** | Weeks 3, 7 |
| Interfaces | Weeks 4-5 |
| Abstract classes | Week 6 |
| SOLID principles | Weeks 3-6 |

**Focus Areas:** LINQ, Inheritance, SOLID

---

## LINQ Review: The Essentials

LINQ methods you'll use on the midterm:

```csharp
// Filter items
var equipped = player.Items.Where(i => i.IsEquipped);

// Transform data
var names = player.Items.Select(i => i.Name);

// Aggregate values
int totalBonus = player.Items
    .Where(i => i.IsEquipped)
    .Sum(i => i.AttackBonus);

// Find one item
var sword = player.Items.FirstOrDefault(i => i.Name == "Sword");
```

---

## LINQ: Calculating Item Bonuses

**Key Pattern for Midterm:**

```csharp
// Sum attack bonuses from equipped items
int attackBonus = player.Items
    .Where(item => item.IsEquipped && item.AttributeModifiers != null)
    .Select(item => item.AttributeModifiers
        .TryGetValue(Attribute.Attack, out var bonus) ? bonus : 0)
    .Sum();
```

This pattern:
1. Filters to equipped items with modifiers
2. Extracts the bonus value (or 0 if not found)
3. Sums all bonuses together

---

## Abstract Classes Review

```csharp
public abstract class MonsterBase
{
    public string Name { get; set; }
    public int Health { get; set; }

    // Abstract method - subclasses MUST implement
    public abstract void PerformSpecialAction();

    // Virtual method - subclasses CAN override
    public virtual void Attack()
    {
        Console.WriteLine($"{Name} attacks!");
    }
}
```

**Key Points:**
- Can't instantiate abstract classes directly
- `abstract` methods have no body
- `virtual` methods have a default implementation

---

## Inheritance in Action

```csharp
public class Goblin : MonsterBase
{
    public override void PerformSpecialAction()
    {
        Console.WriteLine($"{Name} steals gold!");
    }
}

public class Dragon : MonsterBase
{
    public override void PerformSpecialAction()
    {
        Console.WriteLine($"{Name} breathes fire!");
    }

    public override void Attack()
    {
        Console.WriteLine($"{Name} unleashes a devastating attack!");
    }
}
```

---

## SOLID Quick Recap

| Principle | One-Liner |
|-----------|-----------|
| **S**ingle Responsibility | One class, one job |
| **O**pen/Closed | Open for extension, closed for modification |
| **L**iskov Substitution | Subclasses work where parent class works |
| **I**nterface Segregation | Small, focused interfaces |
| **D**ependency Inversion | Depend on abstractions, not concretions |

---

## Two-Project Architecture

```
ConsoleRpgFinal.sln
│
├── ConsoleRpg/                  # UI & Game Logic
│   ├── Program.cs
│   ├── GameEngine.cs
│   └── Services/
│       ├── BattleService.cs     # ← Combat logic
│       └── PlayerService.cs
│
└── ConsoleRpgEntities/          # Data & Models
    ├── Models/
    │   ├── Player.cs            # ← Item methods here
    │   └── MonsterBase.cs
    └── Files/
        └── players.json
```

**ConsoleRpg** references **ConsoleRpgEntities** (not vice versa)

---

## Factory Method Pattern (Nice to Know)

- **Definition:** A creational design pattern that provides an interface for creating objects in a superclass but allows subclasses to alter the type of objects that will be created.
- **Purpose:** To delegate the responsibility of object instantiation to subclasses, promoting loose coupling and flexibility.

---

## Why Use Factory Methods?

* **Benefits:**
    * **Encapsulation:** Encapsulates the object creation process.
    * **Flexibility:** Allows for easy extension and modification of object creation logic.
    * **Decoupling:** Reduces dependencies between classes by using interfaces or abstract classes.

---

## Factory Method in Action

* **Code Example:**
```csharp
public interface IRoomFactory
{
    IRoom CreateRoom(string roomType, OutputManager outputManager);
}

public class RoomFactory : IRoomFactory
{
    public IRoom CreateRoom(string roomType, OutputManager outputManager)
    {
        switch (roomType.ToLower())
        {
            case "treasure":
                return new Room("Treasure Room", "Filled with gold.", outputManager);
        }
    }
}
```

---

## Midterm Tips

1. **Read the requirements carefully** before coding
2. **Start with the simplest task** first
3. **Test frequently** - don't write everything then test
4. **Use existing patterns** - copy/adapt from similar code
5. **Follow TODO comments** in the codebase
6. **Ask for clarification** if requirements are unclear

---

## What to Review Tonight

- [ ] Clone and explore the **w07-midterm-prep** template
- [ ] Practice LINQ: `Where`, `Select`, `Sum`, `FirstOrDefault`
- [ ] Understand abstract classes vs interfaces
- [ ] Know how to add methods to existing classes
- [ ] Review the two-project structure

---

## Questions?

* Post in Canvas discussion board
* Attend office hours
* Ask during class

**Good luck!**

---
