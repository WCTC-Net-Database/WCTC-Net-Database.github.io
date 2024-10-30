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
### Week 10: Entity Framework Core and Table-Per-Hierarchy (TPH)
*Instructor: Mark McArthey*

---

# Entity Framework Core Overview

- **EF Core** is a lightweight, extensible, open-source ORM by Microsoft.
- Provides access to databases and handles CRUD operations efficiently.
- Integrates with .NET applications, offering a code-first or database-first approach.

---

# Table-Per-Hierarchy (TPH) Inheritance

- **TPH** is an inheritance pattern in EF Core.
- Single table represents multiple classes with a **discriminator column**.
- Benefits:
  - Simplicity with fewer tables.
  - Efficient for querying all entity types.
- Example:
```csharp
  public abstract class Character { /* ... */ }
  public class Player : Character { /* ... */ }
  public class NPC : Character { /* ... */ }
```

---

# TPH Inheritance: Detailed Explanation

- **Single Table Representation**: All entities in the hierarchy are stored in a single table.
- **Discriminator Column**: A special column that indicates the type of each row.
- **Advantages**:
  - **Simplicity**: Only one table to manage.
  - **Performance**: Efficient querying across the hierarchy.
- **Disadvantages**:
  - **Sparse Columns**: Columns for all properties of all types, leading to many null values.
  - **Complexity**: More complex to manage when the hierarchy grows.

---

# TPH Inheritance: Example

- **Character Table**:
  - Columns: `Id`, `Name`, `Level`, `RoomId`, `Discriminator`, `Experience`, `AggressionLevel`
  - Rows:
    | Id | Name  | Level | RoomId | Discriminator | Experience | AggressionLevel |
    |----|-------|-------|--------|---------------|------------|-----------------|
    | 1  | Alice | 10    | 1      | Player        | 2000       | NULL            |
    | 2  | Bob   | 5     | 2      | Goblin        | NULL       | 3               |

---

# Why Design-Time Context Setup Matters

- **Design-Time Context**: Required by EF Core for generating migrations and scaffolding.
- EF needs to create an instance of `DbContext` without running the application.
- **Common issue**: If not set up correctly, `dotnet ef migrations add <MigrationName>` can fail.

---

# What is `IDesignTimeDbContextFactory`?

- Interface in EF Core to create `DbContext` at **design-time**.
- Enables EF Core CLI to access a correctly configured `DbContext`.
- Example of creating `GameContext` with `IDesignTimeDbContextFactory`:
```csharp
    public class GameContextFactory : IDesignTimeDbContextFactory<GameContext> {
        public GameContext CreateDbContext(string[] args) {
            var optionsBuilder = new DbContextOptionsBuilder<GameContext>();
            optionsBuilder.UseSqlServer("YourConnectionStringHere");
            return new GameContext(optionsBuilder.Options);
        }
    }
```
---

# How `IDesignTimeDbContextFactory` Helps Migrations

- **Ensures EF CLI can instantiate DbContext**:
  - CLI can’t access services directly, so a factory method is required.
- Factory is called only for design-time operations:
  - **Example**: Running `dotnet ef migrations add` uses this factory.
  - **Runtime** context configuration may differ but won’t impact migrations.

---

# Setting Up `IDesignTimeDbContextFactory` Step-by-Step

1. **Implement the Interface**:
   - Define a class implementing `IDesignTimeDbContextFactory<TContext>`.
   - Provide a `CreateDbContext` method to instantiate `DbContext`.
2. **Configure Options**:
   - Use `DbContextOptionsBuilder` to set up connection strings and providers.
3. **Use Configuration Helper (Optional)**:
   - Optionally, load connection strings dynamically for flexibility.

---

# Setting Up Context Factory

- **Context Factories** create DbContext instances for design-time operations.
- Useful for running migrations and generating scaffolding.
- Example of a `GameContextFactory` implementation:
```csharp
    public class GameContextFactory : IDesignTimeDbContextFactory<GameContext> {
        public GameContext CreateDbContext(string[] args) {
            var configuration = ConfigurationHelper.GetConfiguration();
            var optionsBuilder = new DbContextOptionsBuilder<GameContext>();
            optionsBuilder.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
            return new GameContext(optionsBuilder.Options);
        }
    }
```

  - `IDesignTimeDbContextFactory` enables EF Core CLI operations.
  - Located within the solution for ease of access (see `GameContextFactory.cs`)

---

# Example `GameContextFactory`

```csharp
    public class GameContextFactory : IDesignTimeDbContextFactory<GameContext> {
        public GameContext CreateDbContext(string[] args) {
            var optionsBuilder = new DbContextOptionsBuilder<GameContext>();
            // Retrieve connection string from config or use directly
            optionsBuilder.UseSqlServer(ConfigurationHelper.GetConnectionString("DefaultConnection"));
            return new GameContext(optionsBuilder.Options);
        }
    }
```

- This configuration allows the CLI to instantiate `GameContext` without needing to launch the application itself.

---

# Benefits of `IDesignTimeDbContextFactory`

- **Error Prevention**:
  - Avoids "Unable to create an instance" errors when running migrations.
- **Simplifies Configuration**:
  - Separates design-time configuration from runtime.
  - Keeps `Program.cs` or `Startup.cs` focused on runtime operations.
- **Enables CI/CD**:
  - Supports automated pipelines that require schema migrations.

---

# Design-Time vs. Runtime Context Configuration

- **Design-Time**: Uses `IDesignTimeDbContextFactory` to supply options for migration generation.
- **Runtime**: Configures `DbContext` through DI in `Startup.cs` or `Program.cs`.
- **Best Practice**: Use `IDesignTimeDbContextFactory` for CLI tools and keep runtime logic in DI configuration.

---

# Dependency Injection of GameContext

- Registering DbContext in **Startup** or **Program** class:
```csharp
  services.AddDbContext<GameContext>(options =>
      options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"))
  );
```
- Enables **dependency injection** for DbContext throughout the app.
- Simplifies testing and decouples application layers.

---

# Logging in EF Core

- EF Core supports multiple logging providers, such as Console and File logging.
- Configured using the `Logging` section in app settings:
```csharp
  services.AddLogging(loggingBuilder => {
      loggingBuilder.AddConsole();
      loggingBuilder.AddProvider(new FileLoggerProvider("Logs/log.txt"));
  });
```
- Logs are essential for **tracking SQL queries** and debugging issues (see `Startup.cs`).

---

# Migrations in EF Core

- **Design-Time Migrations**:
  - Created with `dotnet ef migrations add <MigrationName>`.
  - Requires DbContext or DbContextFactory to generate migration files.
- **Runtime Migrations**:
  - Applied with `dotnet ef database update`.
  - Changes are reflected in the database schema based on migrations.

---

# Migration Generation Process

1. **Define/Update Model**: Add or modify model classes.
2. **Add Migration**: Use `dotnet ef migrations add <MigrationName>`.
3. **Review Migration Code**: Check migration files for accuracy.
4. **Apply Migration**: Run `dotnet ef database update`.

---

# Understanding Relationships in EF Core

- Relationships are established through **navigation properties** and **foreign keys**.
- Example: `Room` and `Character` relationship (1 to many):
```csharp
  public class Room {
      public int Id { get; set; }
      public List<Character> Characters { get; set; }
  }

  public class Character {
      public int RoomId { get; set; }
      public Room Room { get; set; }
  }
```

---

# Understanding Relationships in EF Core

- Relationships are established through **navigation properties** and **foreign keys**.
- Example: `Character` and `Ability` relationship (many-to-many):
```csharp
    public abstract class Character
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Level { get; set; }
        public int RoomId { get; set; }
        public virtual Room Room { get; set; }
        public virtual ICollection<Ability> Abilities { get; set; }
    }

    public abstract class Ability
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public virtual ICollection<Character> Characters { get; set; }
    }
```

---

# Summary

- **EF Core** streamlines data access and relationships within applications.
- **TPH** simplifies inheritance and categorization.
- **Context Factory** and **logging** support design-time and runtime operations.
- Migrations allow for structured, iterative schema changes.

---

# References

1. Microsoft Docs - [EF Core Overview](https://docs.microsoft.com/en-us/ef/core/)
2. Microsoft Docs - [TPH Inheritance](https://docs.microsoft.com/en-us/ef/core/modeling/inheritance)
3. Microsoft Docs - [Design-Time Context Creation](https://docs.microsoft.com/en-us/ef/core/cli/dbcontext-creation)
4. Microsoft Docs - [Logging in EF Core](https://docs.microsoft.com/en-us/ef/core/logging-events-diagnostics)
5. Microsoft Docs - [Migrations](https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/)

---