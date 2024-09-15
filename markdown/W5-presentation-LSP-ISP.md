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
### Week 5: Interface Segregation Principle (ISP) and Liskov Substitution Principle (LSP)
*Instructor: Mark McArthey*

---

#### Liskov Substitution Principle (LSP)
- **Definition**:
Objects of a superclass should be replaceable with objects of a subclass without affecting the correctness of the program.
- **What does this mean?**
Subtypes must be substitutable for their base types.
- **Why is it important?**
It ensures that a derived class can stand in for its base class without causing errors.
It promotes the use of polymorphism and enhances code reusability.
- **Example**: If you have a base class Bird and a derived class Penguin, the Penguin class should be able to replace the Bird class without causing issues.

---

#### LSP Example in Practice
Imagine you have a base class `Bird` with a method `Fly()`.
A derived class Penguin should not override `Fly()` if it cannot fly.

**Without LSP**

- Derived classes override methods in a way that violates the expectations set by the base class.
- This can lead to runtime errors and unexpected behavior.
**With LSP**
- Derived classes adhere to the behavior expected by the base class.
- This ensures that the program remains correct and predictable.

---

#### Implementing LSP
**Base Class Example**
```csharp
public class Bird
{
    public virtual void Fly()
    {
        Console.WriteLine("Flying");
    }
}

public class Sparrow : Bird
{
    public override void Fly()
    {
        Console.WriteLine("Sparrow flying");
    }
}
```

---

#### Violating LSP
```csharp
public class Penguin : Bird
{
    public override void Fly()
    {
        throw new NotSupportedException("Penguins cannot fly");
    }
}
```

---

#### Adhering to LSP
```csharp
public class Bird
{
    public virtual void Move()
    {
        Console.WriteLine("Moving");
    }
}

public class Sparrow : Bird
{
    public override void Move()
    {
        Console.WriteLine("Sparrow flying");
    }
}

public class Penguin : Bird
{
    public override void Move()
    {
        Console.WriteLine("Penguin swimming");
    }
}
```

---

#### Interface Segregation Principle (ISP)

- **Definition**:  
  - Clients should not be forced to depend on interfaces they do not use.
  
- **What does this mean?**
  - Split large interfaces into smaller, more specific ones so that implementing classes only need to be concerned with the methods that are of interest to them.
  
- **Why is it important?**
  - It reduces the impact of changes and increases the flexibility of the code.
  - It makes the code easier to understand and maintain.
  
- **Example**: Instead of having a single large interface for all file operations, you can have smaller interfaces for reading and writing operations.

---

#### ISP Example in Practice

Imagine you have a large interface `IFileOperations` that includes methods for reading, writing, deleting, and updating files.  
A class that only needs to read files should not be forced to implement all these methods.

**Without ISP**
* A single large interface with many methods.
* Classes are forced to implement methods they do not need.

**With ISP**
* Multiple smaller interfaces with specific methods.
* Classes implement only the methods they need.

---

#### Implementing ISP
**Large Interface Example**
```csharp
public interface IFileOperations
{
    void ReadFile(string filePath);
    void WriteFile(string filePath, string content);
    void DeleteFile(string filePath);
    void UpdateFile(string filePath, string content);
}
```

---

#### Implementing ISP
**Refactored with ISP**
```csharp
public interface IFileReader
{
    void ReadFile(string filePath);
}

public interface IFileWriter
{
    void WriteFile(string filePath, string content);
}

public interface IFileDeleter
{
    void DeleteFile(string filePath);
}

public interface IFileUpdater
{
    void UpdateFile(string filePath, string content);
}
```

---

#### Implementing Interface Behaviors
- **Definition**:
Implementing interface behaviors involves creating classes that adhere to the contracts defined by interfaces.
- **Why is it important?**
It ensures that classes provide specific functionalities as expected.
It promotes code reusability and flexibility.

---

#### Implementing Interface Behaviors
**Example**
```csharp
public interface IFileReader
{
    void ReadFile(string filePath);
}

public class CsvFileReader : IFileReader
{
    public void ReadFile(string filePath)
    {
        // Implementation for reading CSV files
    }
}

public class JsonFileReader : IFileReader
{
    public void ReadFile(string filePath)
    {
        // Implementation for reading JSON files
    }
}
```

---

#### Casting Types When Executing Behaviors

- **Definition**:
Casting types involves converting an object of one type to another type.
- **Why is it important?**
It allows you to work with objects through their interfaces or base classes.
It enables polymorphism and flexible code design.
**Example**
```csharp
IFileReader fileReader = new CsvFileReader();
fileReader.ReadFile("data.csv");

fileReader = new JsonFileReader();
fileReader.ReadFile("data.json");
```

--- 

### General Tips on ISP and LSP

1. **ISP**: Keep interfaces small and focused on specific behaviors.
2. **LSP**: Ensure derived classes adhere to the behavior expected by their base classes.
3. **Use Descriptive Names**: Interface and class names should clearly indicate their purpose.
4. **Implement Incrementally**: Start with basic implementations and extend as needed.
5. **Leverage Polymorphism**: Use interfaces and base classes to allow different implementations to be used interchangeably.

---

### Recap

- **ISP**: Split large interfaces into smaller, more specific ones.
- **LSP**: Ensure derived classes can replace base classes without affecting correctness.
- **Implementing Interface Behaviors**: Create classes that adhere to interface contracts.
- **Casting Types**: Convert objects to work with them through their interfaces or base classes.

These concepts will help you write flexible, maintainable code that adheres to best practices and is easily extendable.

---

### Additional Resources

* [Official C# Documentation](https://learn.microsoft.com/en-us/dotnet/csharp/)
* [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
* [Design Patterns](https://refactoring.guru/design-patterns)
* [Interface Segregation Principle](https://www.baeldung.com/cs/interface-segregation-principle)
* [Liskov Substitution Principle](https://www.baeldung.com/cs/liskov-substitution-principle)
