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
### Week 6: Dependency Inversion Principle (DIP) and Abstract Classes - Continuing Data Contexts
*Instructor: Mark McArthey*

--- 

#### DIP: The "D" in SOLID
- **Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions.
- **Example:** A car: The engine (high-level) should not depend directly on the specific type of fuel (low-level). Instead, both should depend on an abstract `Fuel` interface.

--- 

#### Why DIP Matters
* **Benefits:**
    * **Flexibility:** Easily change implementations without affecting high-level code.
    * **Testability:** Easier to write unit tests for isolated components.
    * **Maintainability:** Easier to modify and extend code.

---

#### DIP in Action
* **Code Example:**
    ```csharp
    public interface IShape
    {
        void Draw();
    }

    public class Circle : IShape
    {
        public void Draw() => Console.WriteLine("Drawing a circle");
    }

    public class Square : IShape
    {
        public void Draw() => Console.WriteLine("Drawing a square");
    }

    public class ShapeDrawer
    {
        private readonly IShape _shape;

        public ShapeDrawer(IShape shape)
        {
            _shape = shape;
        }

        public void DrawShape() => _shape.Draw();
    }
    ```

---

#### Abstract Classes: A Building Block
* **Definition:** Base classes that define common behavior and structure for derived classes.
* **Example:** A `Vehicle` abstract class could define properties like `MaxSpeed` and methods like `Drive()`, while concrete classes like `Car` and `Motorcycle` could implement them differently.

---

#### Abstract Classes and DIP
* **Relationship:** Abstract classes can be used to define abstractions in DIP. High-level modules can depend on the abstract base class, while low-level modules implement it.

---

#### Real-World Example: A Game
* **Scenario:** A simple game with characters (e.g., player, enemy).
* **Using DIP and Abstract Classes:**
    * Define an abstract `Character` class with properties like `Health` and methods like `Attack()`.
    * Create concrete classes like `PlayerCharacter` and `EnemyCharacter` that inherit from `Character`.
    * A `GameEngine` can depend on the abstract `Character` class, allowing it to work with different types of characters without modifications.

---

#### Additional Tips
* **Dependency Injection:** Use a DI framework or manual injection to provide dependencies to classes.
* **Favor Composition over Inheritance:** Consider using composition (e.g., having a `ShapeDrawer` class contain an `IShape`) in some cases for more flexibility.
* **Avoid Circular Dependencies:** Ensure classes don't directly or indirectly depend on each other in a circular way.

---

#### Recap
* **Key Points:**
    * DIP promotes loose coupling and testability.
    * Abstract classes provide a common foundation for related classes.
    * Use DIP and abstract classes together for flexible and well-structured code.

---

#### Next Steps
* **Practice:** Try implementing DIP and abstract classes in your own projects.
* **Explore Further:** Learn more about dependency injection frameworks and design patterns.
* **Ask Questions:** Don't hesitate to ask if you have any questions.

