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
### Week 4: Open/Closed Principle (OCP) and Interfaces - Converting CSV to JSON
*Instructor: Mark McArthey*

---

### Open/Closed Principle (OCP), Interfaces, and Polymorphism

- **Definition**:  
  - A class should be **open for extension** but **closed for modification**.
  
- **What does this mean?**
  - You should be able to **extend** the behavior of a class without altering its existing code.
  
- **Why is it important?**
  - It reduces the risk of breaking existing functionality.
  - It allows you to add new features more easily and safely.
  
- **Example**: Instead of modifying a class every time a new feature is added, you introduce new classes that extend or build upon the original functionality.

---

#### OCP Example in Practice

Imagine your character management program reads and writes character data from a **CSV file**.  
Your boss walks in and decides now you need to extend the program to support **JSON** files.

Rather than modifying the existing CSV code, you can create new classes for JSON handling, adhering to OCP. This keeps your core logic intact and makes your program more flexible for future changes (e.g., adding XML support).

**Without OCP**
* Directly modifying the existing CSV handling code to add JSON support.
* High risk of introducing bugs and breaking existing functionality.

**With OCP**
* Creating new classes for JSON handling without altering the existing CSV code.
* Adhering to OCP keeps core logic intact and makes the program more flexible for future changes (e.g., adding XML support).

---

#### Interfaces: Enabling Flexibility

- **Definition**:  
  An interface is a **contract** that defines what methods a class must implement but leaves the actual implementation up to the class.

- **Why use interfaces?**
  - They allow for **flexible and scalable designs**.
  - They support OCP by enabling you to add new functionality without modifying existing code.
  
---

#### Interfaces: Enabling Flexibility Example

By using the `IFileHandler` interface, your program can read and write character data in different formats (CSV, JSON, etc.) by simply implementing this interface in new classes.

```csharp
public interface IFileHandler
{
    List<Character> ReadCharacters(string filePath);
    void WriteCharacters(string filePath, List<Character> characters);
}
```

---

#### Interfaces: Implementing Interfaces

By using the `IFileHandler` interface, your program can read and write character data in different formats (CSV, JSON, etc.) by simply implementing this interface in new classes.

**CSV File Handler**
```csharp
public class CsvFileHandler : IFileHandler
{
    public List<Character> ReadCharacters(string filePath)
    {
        // Implementation for reading CSV
    }

    public void WriteCharacters(string filePath, List<Character> characters)
    {
        // Implementation for writing CSV
    }
}
```
---

#### Interfaces: Implementing Interfaces

By using the `IFileHandler` interface, your program can read and write character data in different formats (CSV, JSON, etc.) by simply implementing this interface in new classes.

**JSON File Handler**
```csharp
public class JsonFileHandler : IFileHandler
{
    public List<Character> ReadCharacters(string filePath)
    {
        // Implementation for reading JSON
    }

    public void WriteCharacters(string filePath, List<Character> characters)
    {
        // Implementation for writing JSON
    }
}
```

---

#### Interfaces: General Tips on Interfaces

1. **Define Clear Contracts**: Ensure your interfaces clearly define the expected behavior.
2. **Keep It Simple**: Avoid adding too many methods to an interface; keep it focused on a single responsibility.
3. **Use Descriptive Names**: Interface names should clearly indicate their purpose (e.g., IFileHandler).
4. **Implement Incrementally**: Start with a basic implementation and extend as needed.
5. **Leverage Polymorphism**: Use interfaces to allow different implementations to be used interchangeably.

---

#### Polymorphism: Working with Different Implementations

- **Polymorphism** allows an object to take many forms.
  
- In our case, different file handlers (CSV, JSON) can all be treated as the same type, thanks to **interfaces**.

- **Key Idea**:  
  You can work with objects through their interface without needing to know the specific type (CSV or JSON) at runtime.

---

#### Example: Polymorphism in Action

Let’s say you want to read character data from a file, but you don’t know whether it’s a CSV or JSON file until runtime.

You can still handle both types using the same code, thanks to polymorphism:

```csharp
IFileHandler fileHandler = new CsvFileHandler(); // This could be JSON instead
List<Character> characters = fileHandler.ReadCharacters("input.csv");
```

**Benefit**: You don't need to modify your program logic when switching from CSV to JSON, as long as both implement the same `IFileHandler` interface.

---

#### Refactoring for OCP

In your Week 2 assignment, you handled CSV files directly within your main program.  
Now, refactor the program so that it uses an **interface** for file handling.

**Steps to Refactor**
1. **Create an interface** such as IFileHandler that defines the contract for reading and writing character data.
2. **Implement the interface** in concrete classes for CSV and JSON handling.
3. **Use polymorphism** in your main program to work with these concrete classes through the interface, allowing flexibility without modifying existing logic.

---

#### Benefits of Using Interfaces

- **Extensibility**:  
  You can add new file formats, such as XML, by implementing the `IFileHandler` interface, without modifying the main program.
  
- **Maintainability**:  
  Your code becomes easier to maintain because each file format handler has its own implementation class.

- **Polymorphism**:  
  The main program only needs to work with the interface (`IFileHandler`), and it doesn't matter which file format is used behind the scenes.

---

#### Stretch Goal: Extending OCP

If you choose to go further, you can explore ways to dynamically switch between different file formats at runtime. This would involve selecting the appropriate file handler based on user input and utilizing the flexibility offered by interfaces and polymorphism.  As a tip, research the **strategy pattern** for implementation ideas.

---

#### Recap

- **OCP**: Keep your program open for extensions but closed for modification.
- **Interfaces**: Define the expected behavior, allowing multiple implementations.
- **Polymorphism**: Work with objects through their interface, enabling flexibility in your program.
  
These concepts will help you write flexible, maintainable code that adheres to best practices and is easily extendable.

---

### Additional Resources

* [Official C# Documentation](https://learn.microsoft.com/en-us/dotnet/csharp/)
* [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
* [Design Patterns](https://refactoring.guru/design-patterns)