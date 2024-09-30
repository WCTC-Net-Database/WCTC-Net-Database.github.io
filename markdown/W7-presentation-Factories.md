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
### Week 7: C# Contexts and Factories
*Instructor: Mark McArthey*

---

#### Factory Method Pattern
- **Definition:** A creational design pattern that provides an interface for creating objects in a superclass but allows subclasses to alter the type of objects that will be created.
- **Purpose:** To delegate the responsibility of object instantiation to subclasses, promoting loose coupling and flexibility.

---

#### Why Use Factory Methods?
* **Benefits:**
    * **Encapsulation:** Encapsulates the object creation process.
    * **Flexibility:** Allows for easy extension and modification of object creation logic.
    * **Decoupling:** Reduces dependencies between classes by using interfaces or abstract classes.

---

#### Factory Method in Action
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
                return new Room("Treasure Room", "Filled with gold and treasures.", outputManager);
        }
    }
}
```

---

#### Implementing Factory Methods
* **Steps:**
    1. **Define an Interface or Abstract Class:** Create an interface or abstract class that declares the factory method.
    2. **Implement the Factory Method:** Create concrete classes that implement the factory method to instantiate specific objects.
    3. **Use the Factory Method:** Use the factory method in your code to create objects, promoting loose coupling and flexibility.

---

#### Example: Room Factory
* **Scenario:** Creating different types of rooms in a game.
* **Using Factory Method**:
  * Define an `IRoomFactory` interface with a `CreateRoom` method.
  * Implement the `RoomFactory` class to create specific room types based on input.

---

#### Tips for Using Factory Methods
* **Encapsulate Object Creation:** Use factory methods to encapsulate the logic of object creation, making your code more modular and easier to maintain.
* **Promote Loose Coupling:** Use interfaces or abstract classes to reduce dependencies between classes.
* **Extend Easily:** Factory methods make it easy to add new types of objects without modifying existing code.

---

#### Further Reading
* [Factory Method Pattern - Refactoring.Guru](https://refactoring.guru/design-patterns/factory-method)
* [Factory Method Pattern in C# - DotNetTricks](https://www.dotnettricks.com/learn/designpatterns/factory-method-design-pattern-dotnet)
* [Creational Design Patterns - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/design-patterns/creational-design-patterns)

---

#### Recap
* **Key Points:**
    * Factory methods encapsulate object creation logic.
    * They promote loose coupling and flexibility.
    * Use factory methods to create objects in a modular and maintainable way.

---

#### Next Steps
* **Practice:** Implement factory methods in your own projects.
* **Explore Further:** Learn more about other creational design patterns.
* **Ask Questions:** Don't hesitate to ask if you have any questions.

---
