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
### Week 13: EF Core Patterns - Service v Repository
*Instructor: Mark McArthey*

---

# **What is a Repository?**

A **repository** is a pattern that encapsulates data access logic. It provides a consistent API for querying, saving, and deleting data without exposing the underlying database or ORM implementation.

### Responsibilities:
1. Abstract database access using Entity Framework or other ORMs.
2. Encapsulate CRUD (Create, Read, Update, Delete) operations.
3. Provide reusable methods for data retrieval.

---

# **Why Use Repositories?**

### Benefits:
- Decouples data access logic from business logic.
- Makes code **cleaner** and **easier to test**.
- Allows for flexibility in switching ORMs or database providers.

### Example: Switching from Entity Framework to Dapper
By centralizing data access in repositories, switching ORMs involves only updating the repository implementation without affecting business logic.

---

# **CRUD Operations in a Repository**
### Example: PlayerRepository CREATE (Add)

```csharp
public class PlayerRepository
{
    private readonly GameContext _context;
    public PlayerRepository(GameContext context) { _context = context; }

    // Create a new player
    public void AddPlayer(Player player)
    {
        _context.Players.Add(player);
        _context.SaveChanges();
    }
}
```

---

# **CRUD Operations in a Repository**
### Example: PlayerRepository READ

```csharp
public class PlayerRepository
{
    private readonly GameContext _context;
    public PlayerRepository(GameContext context) { _context = context; }
    
    // Read (Get a player by ID)
    public Player GetPlayerById(int id)
    {
        return _context.Players
            .Include(p => p.Inventory)
            .Include(p => p.Equipment)
            .FirstOrDefault(p => p.Id == id);
    }
```

---

# **CRUD Operations in a Repository**
### Example: PlayerRepository UPDATE

```csharp
public class PlayerRepository
{
    private readonly GameContext _context;
    public PlayerRepository(GameContext context) { _context = context; }

    // Update a player
    public void UpdatePlayer(Player player)
    {
        _context.Players.Update(player);
        _context.SaveChanges();
    }
```

---

# **CRUD Operations in a Repository**
### Example: PlayerRepository DELETE

```csharp
public class PlayerRepository
{
    private readonly GameContext _context;
    public PlayerRepository(GameContext context) { _context = context; }

    // Delete a player
    public void DeletePlayer(int id)
    {
        var player = GetPlayerById(id);
        if (player != null)
        {
            _context.Players.Remove(player);
            _context.SaveChanges();
        }
    }
```

---

# **Why `PlayerService` is NOT a Repository**

A **repository abstracts data access**, while a **service encapsulates business logic** that uses the `Player` entity.

### Repository Example:
```csharp
public class PlayerRepository
{
    private readonly GameContext _context;
    public PlayerRepository(GameContext context) { _context = context; }

    public Player GetPlayerById(int id)
    {
        return _context.Set<Player>()
            .Include(p => p.Inventory)
            .Include(p => p.Equipment)
            .FirstOrDefault(p => p.Id == id);
    }

    public void SavePlayer(Player player)
    {
        _context.Update(player);
        _context.SaveChanges();
    }
}
```

---

# **Service Example**
A `PlayerService` focuses on **business rules**:

```csharp
public class PlayerService
{
    private readonly PlayerRepository _playerRepository;
    private readonly IOutputService _outputService;

    public PlayerService(PlayerRepository playerRepository, IOutputService outputService)
    {
        _playerRepository = playerRepository;
        _outputService = outputService;
    }

    public void Attack(Player player, ITargetable target)
    {
        if (player.Equipment?.Weapon == null)
        {
            _outputService.WriteLine($"{player.Name} has no weapon equipped!");
            return;
        }

        _outputService.WriteLine($"{player.Name} attacks {target.Name} with a {player.Equipment.Weapon.Name}!");
        target.Health -= player.Equipment.Weapon.Attack;

        _outputService.WriteLine($"{target.Name} has {target.Health} health remaining.");
        _playerRepository.SavePlayer(player);
    }
}
```

---

# **Key Differences Between Service and Repository**

| Aspect                 | Repository                            | Service                                    |
|------------------------|---------------------------------------|-------------------------------------------|
| **Primary Role**       | Manages data access (CRUD operations).| Encapsulates business logic and behaviors.|
| **Focus**              | Works directly with the database.     | Works on business rules using entities.   |
| **Dependency on Entities** | Focused on entities (e.g., `Player`).| Operates on entities but can mix them with business-specific logic.|
| **Dependency Injection** | Often depends on the DbContext or unit of work. | Injects other dependencies like `IOutputService`. |
| **Scope**              | Limited to CRUD operations or querying. | May call repositories, external services, or APIs.|
| **Examples of Operations** | - `GetPlayerById`<br>- `SavePlayer`<br>- `DeletePlayer` | - `AttackTarget`<br>- `EquipItem`<br>- `UseAbility` |

---

# **Why Separate Services and Repositories?**

### **Repositories**:
- Handle **data access** and **CRUD** operations.
- Centralized logic for database interactions.
- Example: Retrieve or save a player.

### **Services**:
- Handle **business rules** involving multiple entities or logic.
- Encapsulate higher-level application behaviors.
- Example: Player attacks a target.

---

# **Benefits of Separation**

### Cleaner Code
- Repositories handle data access.
- Services focus on business rules.

### Testability
- Mock repositories for service testing.
- Test repositories independently for CRUD operations.

### Scalability
- Changes to data storage (e.g., new ORM) only impact repositories, not services.

---

# **Combining Repositories and Services**

For simpler projects, you can combine the two into a **repository-service** hybrid.  Repositories can handle both data access and basic logic. This **hybrid approach** simplifies development but may reduce scalability.

### Example:
```csharp
public class PlayerRepositoryService
{
    private readonly GameContext _context;
    private readonly IOutputService _outputService;

    public PlayerRepositoryService(GameContext context, IOutputService outputService)
    {
        _context = context;
        _outputService = outputService;
    }

    public Player GetPlayerById(int id)
    {
        return _context.Set<Player>()
            .Include(p => p.Inventory)
            .Include(p => p.Equipment)
            .FirstOrDefault(p => p.Id == id);
    }

    public void Attack(Player player, ITargetable target)
    {
        if (player.Equipment?.Weapon == null)
        {
            _outputService.WriteLine($"{player.Name} has no weapon equipped!");
            return;
        }

        _outputService.WriteLine($"{player.Name} attacks {target.Name} with {player.Equipment.Weapon.Name}!");
        target.Health -= player.Equipment.Weapon.Attack;
        _context.SaveChanges();
    }
}
```

---

# **When to Use Each Approach**

| Use Case                                  | Repository Only          | Service + Repository    | Hybrid Repository-Service |
|-------------------------------------------|--------------------------|--------------------------|---------------------------|
| CRUD operations with minimal logic        | ✅                        | ❌                        | ✅                         |
| Business logic involving multiple entities| ❌                        | ✅                        | ❌                         |
| Small projects with minimal layers        | ❌                        | ❌                        | ✅                         |
| Large, complex applications               | ❌                        | ✅                        | ❌                         |

---

# **Recommendation for ConsoleRPG**

- **Separate Repositories for CRUD**:
  - Abstract database logic into `PlayerRepository`, `MonsterRepository`, etc.

- **Services for Business Logic**:
  - Use `PlayerService` for game mechanics like attacking or equipping items.

- **Hybrid for Simplicity**:
  - Smaller projects can use combined repository-service classes.

---

# **Key Takeaways**

- Services and Repositories solve **different problems**:
- Keep **entities lightweight**:
  - e.g. Avoid injecting services like `IOutputService` into entities.
- Use **separation for scalability** and **hybrid approaches for simplicity**.

**Repositories**:
   - Focused on CRUD operations and data access.
   - Encapsulate database interactions to simplify the rest of the code.

**Services**:
   - Handle higher-level business rules and behaviors.
   - Use repositories to perform data access.

**When to Combine**:
   - Small projects can use hybrid repository-service classes.
   - Larger projects benefit from keeping them separate for scalability and maintainability.

---

# References
- [Reddit: Difference between Repository and Service Pattern](https://www.reddit.com/r/dotnet/comments/17g22r4/what_is_the_difference_between_repository_and/)
- [Microsoft Docs: Repository Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/repository)
- [Microsoft Docs: Dependency Injection](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection)
- [SOLID Principles Overview](https://en.wikipedia.org/wiki/SOLID)

---
