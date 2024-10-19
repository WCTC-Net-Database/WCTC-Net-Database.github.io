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
### Week 9: Entity Framework Core and DbContext
*Instructor: Mark McArthey*

---

# **Introduction to Entity Framework Core**
- EF Core is an ORM (Object Relational Mapper) that simplifies database access.
- It maps C# classes to database tables.
- We'll focus on how EF Core helps manage relationships between entities like `Room` and `Character`.

---

# **What is a DbContext?**
- The **DbContext** represents the session with the database.
- It manages the connection to the database and tracks changes to entities.
- Acts as a bridge between your code and the database.
  
Example:
```csharp
public class GameContext : DbContext
{
    public DbSet<Character> Characters { get; set; }
    public DbSet<Room> Rooms { get; set; }
}
```

---

# **Relationships in Entity Framework**
- EF Core supports defining relationships between entities using navigation properties.
- There are three main types:
    1. **One-to-Many** (e.g., Room to Characters)
    2. **Many-to-Many**
    3. **One-to-One**

Example (Room-Character Relationship):
- **Room** can have multiple **Characters**.
- Each **Character** belongs to one **Room**.

```csharp
public class Room
{
    public int Id { get; set; }
    public string Name { get; set; }
    public ICollection<Character> Characters { get; set; }
}

public class Character
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int RoomId { get; set; }
    public Room Room { get; set; }
}
```

---

# **Migrations Overview**
- **Migrations** help keep the database schema in sync with your model classes.
- Allows you to evolve the database as your application changes without losing data.
- EF Core generates migration scripts based on changes in your `DbContext`.

Steps:
1. **Add Migration**: Generates migration files based on changes.
   ```bash
   dotnet ef migrations add InitialCreate
   ```
2. **Update Database**: Applies migration to the database.
   ```bash
   dotnet ef database update
   ```

---

# **How Migrations Work**
- When you run `Add Migration`, EF Core compares the current model with the last migration snapshot.
- It generates SQL commands to create or modify the database schema.
- Running `Update Database` executes these commands.

Example:
- Adding a `Room` entity will generate SQL commands to create a `Rooms` table.
- Modifying the `Character` entity will update the `Characters` table.

---

# **Common Migration Commands**
- **Add Migration**: Creates a new migration file with changes.
   ```bash
   dotnet ef migrations add <MigrationName>
   ```
- **Remove Migration**: Deletes the last migration.
   ```bash
   dotnet ef migrations remove
   ```
- **List Migrations**: Lists all migrations.
   ```bash
   dotnet ef migrations list
   ```
- **Update Database**: Applies pending migrations.
   ```bash
   dotnet ef database update
   ```

---

# **Seeding the Database**
- Seeding is the process of populating the database with initial data.
- Define data inside your `DbContext` to be added to the database during migrations.

Example:
```csharp
modelBuilder.Entity<Room>().HasData(
    new Room { Id = 1, Name = "Entrance Hall" },
    new Room { Id = 2, Name = "Dungeon" }
);

modelBuilder.Entity<Character>().HasData(
    new Character { Id = 1, Name = "Hero", RoomId = 1 }
);
```

---

# **Using the DbContext in Your Code**
- Querying the database: Use the `DbContext` to retrieve and manipulate data.

Example:
```csharp
using (var context = new GameContext())
{
    var rooms = context.Rooms.Include(r => r.Characters).ToList();
    foreach (var room in rooms)
    {
        Console.WriteLine($"{room.Name} has {room.Characters.Count} characters.");
    }
}
```
- This fetches rooms along with their associated characters.

---

# **Wrapping Up**
- **Entity Framework Core** simplifies database access by allowing you to work with classes instead of raw SQL.
- **Migrations** ensure your database evolves as your code changes.
- Relationships like **Room** and **Character** are managed through navigation properties and entity relationships.
  
Use the tools learned to complete the assignment, focusing on:
- Adding new rooms and characters.
- Managing relationships using EF Core.

---

# **References**

- [Entity Framework Code First v/s Database First Approach](https://www.c-sharpcorner.com/blogs/entity-framework-code-first-vs-database-first-approach)
- [Getting Started with Entity Framework Core in .NET - Video - Nick Chapsas](https://youtu.be/2t88FOeQ898?si=j9o2p58NDRfch7V-)
- [Getting Started with EF Core](https://learn.microsoft.com/en-us/ef/core/get-started/overview/first-app?tabs=netcore-cli)
- [Migrations and Seed Data](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/?tabs=dotnet-core-cli)
- [Working with DbContext](https://learn.microsoft.com/en-us/ef/core/dbcontext-configuration/)
- [Defining Relationships](https://learn.microsoft.com/en-us/ef/core/modeling/relationships)
- [Entity Framework Core Tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet)
