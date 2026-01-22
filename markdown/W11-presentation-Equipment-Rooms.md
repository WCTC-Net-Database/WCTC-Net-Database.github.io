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
### Week 11: Equipment System & Room Navigation
*Instructor: Mark McArthey*

---

#### **Introduction**
   - **Entity Framework Core** (EF Core) is a popular Object-Relational Mapper (ORM) for .NET.
   - **Objectives:**
     - Understanding EF Core basics.
     - Setting up **Table Per Hierarchy (TPH)** and abstract classes.
     - Configuring **design-time context**.
     - Leveraging **interfaces** for flexible code.
     - Managing **entity relationships** and **logging**.

---

#### **Why Use Interfaces?**
   - **Interfaces** define behavior without tying to a specific implementation.
   - **SOLID Principles** supported:
     - **Dependency Inversion** and **Open-Closed** principles.
   - **Benefits:**
     - **Flexibility:** Easily swap implementations.
     - **Testability:** Mock interfaces for unit tests.
     - **Maintainability:** Separates behavior from implementation.

   **Example Interface Setup**
   ```csharp
   public interface ICharacter
   {
       string Name { get; }
       void PerformAction();
   }
   ```

---

#### **Introducing Entity Framework Core (EF Core)**
   - EF Core simplifies data management by mapping database tables to .NET objects.
   - **Key Components**:
     - **DbContext:** Manages database connections.
     - **DbSet:** Represents collections of entities.

---

#### **Configuring DbContext**
   - Example setup for `GameContext`:
   ```csharp
   public class GameContext : DbContext
   {
       public DbSet<Player> Players { get; set; }
       public DbSet<Room> Rooms { get; set; }
       public DbSet<Monster> Monsters { get; set; }
   }
   ```

---

#### **TPH (Table Per Hierarchy) for Inheritance**
   - **TPH** allows storing data for multiple types in a single table.
   - Uses a **discriminator column** to distinguish between types.
   
   **Implementing TPH**
   ```csharp
   modelBuilder.Entity<Monster>()
       .HasDiscriminator<string>(m => m.MonsterType)
       .HasValue<Goblin>("Goblin");
   ```

---

#### **Design-Time Configuration**
   - **Context Factory:** Needed for `dotnet ef migrations` commands and smooth migrations.
   - Factory setup for design-time context:
   ```csharp
   public class GameContextFactory : IDesignTimeDbContextFactory<GameContext>
   {
       public GameContext CreateDbContext(string[] args)
       {
           var optionsBuilder = new DbContextOptionsBuilder<GameContext>();
           optionsBuilder.UseSqlServer("YourConnectionStringHere");
           return new GameContext(optionsBuilder.Options);
       }
   }
   ```
---

#### Why is Design-Time Configuration Important?

- Needed for `dotnet ef migrations` commands.
- Ensures EF Core CLI can configure `GameContext` without running the application.
- Avoids **"context not found"** errors when creating migrations.

#### Common Errors
- Missing or incorrect factory setup.
- Unresolved connection strings.

---

#### Migrations: Design-Time vs Runtime

- **Design-Time** migrations help structure the database schema based on the model.
  - `dotnet ef migrations add <MigrationName>`
- **Runtime Migrations**: Apply the schema changes to the database.
  - `dotnet ef database update`

#### Migration Lifecycle:
1. Define model updates in code.
2. Create migration at design-time.
3. Apply migrations at runtime.

---

#### **Entity Relationships**

- In Entity Framework Core (EF Core), navigation properties in your entity classes should **use the concrete entity types rather than interfaces**. 
- This is because EF Core's change tracking, relationship mapping, and other **internal mechanisms rely on concrete types to correctly map relationships and generate queries**. 
- Interfaces don't provide enough information for EF Core to perform these operations.

--- 
**Why Interfaces Don't Work for Navigation Properties:**

- **Change Tracking:** EF Core tracks changes to entities to know when to update the database. It needs concrete types to identify and track these entities.
- **Relationship Mapping:** When mapping relationships, EF Core needs to know the concrete types to generate the appropriate foreign keys and join tables.
- **Query Generation:** EF Core generates SQL queries based on the entity types. Interfaces don't contain the necessary metadata for query generation.

---

#### **Entity Relationships**
   - **Many-to-Many Example:** Between `Player` and `Ability`.
   ```csharp
   modelBuilder.Entity<Player>()
       .HasMany(p => p.Abilities)
       .WithMany(a => a.Players)
       .UsingEntity(j => j.ToTable("PlayerAbilities"));
   ```
   - **One-to-Many Example:** Room containing multiple Characters.
   ```csharp
   public class Room
   {
       public int Id { get; set; }
       public string Name { get; set; }
       public List<Character> Characters { get; set; }
   }
   ```

---

#### **Logging in EF Core**
   - Enable logging for debugging and performance monitoring.
   ```csharp
   optionsBuilder.UseSqlServer("YourConnectionString")
       .LogTo(Console.WriteLine, LogLevel.Information);
   ```

---

#### **Managing Migrations**
   - **Create Migration:**
     ```bash
     dotnet ef migrations add InitialCreate
     ```
   - **Apply Migration:**
     ```bash
     dotnet ef database update
     ```

---

#### **Seeding the Database**
   - Seeding provides a baseline dataset for testing.
   ```csharp
   protected override void OnModelCreating(ModelBuilder modelBuilder)
   {
       modelBuilder.Entity<Room>().HasData(new Room { Id = 1, Name = "Starting Room" });
   }
   ```

---

#### **Best Practices Summary**
   - Use **interfaces** for flexible, testable code.
   - Set up **design-time context** for hassle-free migrations.
   - **Interfaces in Business Logic:** You can continue to use interfaces in your business logic, methods, and services for abstraction and testing purposes.
   - **Entity Classes Should Be POCOs:** Keep your entity classes as Plain Old CLR Objects (POCOs) with minimal dependencies to facilitate EF Core's requirements.
   - **Log** operations to monitor EF Core interactions.
   - Carefully **seed data** to maintain data integrity.

---

#### **References**
   - [Entity Framework Core Docs](https://docs.microsoft.com/en-us/ef/core/)
   - [EF Core Relationships](https://docs.microsoft.com/en-us/ef/core/modeling/relationships)
   - [Programming to an Interface](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/interfaces/)
   - [Navigations and Collections](https://docs.microsoft.com/en-us/ef/core/modeling/relationships#navigations)
   - [Inheritance Mapping](https://docs.microsoft.com/en-us/ef/core/modeling/inheritance)
   - [Entity Relationships in EF Core](https://learn.microsoft.com/en-us/ef/core/modeling/relationships/)
   - [Logging in EF Core](https://learn.microsoft.com/en-us/ef/core/logging-events-diagnostics/)

--- 
