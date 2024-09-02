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
## Week 3 Curriculum - Introduction to LINQ in C#
*Instructor: Mark McArthey*

---

## What is LINQ?

* **LINQ** stands for **Language Integrated Query**.
* Introduced in C# 3.0.
* Provides a consistent way to query data from different sources:
  * **In-memory collections** (e.g., arrays, lists)
  * **Databases** (e.g., SQL)
  * **XML documents**
* Integrates querying capabilities directly into C#.

---

## Benefits of Using LINQ

* **Readable and concise**: Simplifies complex queries.
* **Type-safe**: Compile-time checking.
* **IntelliSense support**: Enhances developer productivity.
* **Versatile**: Works with various data sources.

---

## LINQ Syntax

There are two main syntax styles in LINQ:

1. **Query Syntax**:
   * Similar to SQL.
   * Uses keywords like `from`, `where`, `select`.
2. **Method Syntax**:
   * Uses extension methods like `Where()`, `Select()`, `OrderBy()`.

---

## Query Syntax Example

```csharp
var highLevelCharacters = from character in characters
                          where character.Level > 3
                          select character;
```  
Method Syntax Example
---------------------

    
    var highLevelCharacters = characters
                                .Where(c => c.Level > 3)
                                .Select(c => c);
            
---

Common LINQ Methods
-------------------

*   `Where`: Filters elements based on a condition.
*   `Select`: Projects each element into a new form.
*   `OrderBy` / `OrderByDescending`: Sorts elements.
*   `First` / `FirstOrDefault`: Retrieves the first element.
*   `Any`: Checks if any elements satisfy a condition.
*   `All`: Checks if all elements satisfy a condition.

---

Using `Where`
-------------

Filters a collection based on a predicate.

```csharp
var warriors = characters.Where(c => c.Class == "Warrior");
```            

**Explanation**: Selects all characters whose `Class` property is "Warrior".

---

Using `Select`
--------------

Projects each element into a new form.
```csharp
var characterNames = characters.Select(c => c.Name);
```
**Explanation**: Creates a collection of character names from the `characters` list.

---

Using `OrderBy`
---------------

Sorts a collection in ascending order.
```csharp
var sortedByLevel = characters.OrderBy(c => c.Level);
```
**Explanation**: Sorts characters based on their `Level` property.

---

Using `FirstOrDefault`
----------------------

Retrieves the first element that matches a condition or default value.
```csharp
var firstMage = characters.FirstOrDefault(c => c.Class == "Mage");
```
**Explanation**: Finds the first character with the class "Mage" or returns `null` if none found.

---

Combining Multiple Methods
--------------------------

LINQ methods can be chained for complex queries.

```csharp
var topWarriors = characters
                    .Where(c => c.Class == "Warrior")
                    .OrderByDescending(c => c.Level)
                    .Take(3);
```   

**Explanation**: Selects the top 3 highest-level Warriors.

---

LINQ with Arrays
----------------
```csharp
string[] names = { "Aragorn", "Legolas", "Gimli", "Boromir", "Frodo" };

var longNames = names.Where(name => name.Length > 5);
```

**Output**:

*   Aragorn
*   Legolas
*   Boromir

---

LINQ with Lists
---------------
```csharp
List numbers = new List { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

var evenNumbers = numbers.Where(n => n % 2 == 0).ToList();
```   

**Output**:
*   2, 4, 6, 8, 10

---

LINQ with Custom Objects
------------------------
```csharp
public class Character
{
    public string Name { get; set; }
    public string Class { get; set; }
    public int Level { get; set; }
}

List characters = new List
{
    new Character { Name = "Aragorn", Class = "Ranger", Level = 10 },
    new Character { Name = "Legolas", Class = "Archer", Level = 9 },
    new Character { Name = "Gimli", Class = "Warrior", Level = 8 },
    new Character { Name = "Boromir", Class = "Warrior", Level = 7 },
    new Character { Name = "Frodo", Class = "Hobbit", Level = 5 }
};
```            
---

Example: Find High-Level Warriors
---------------------------------
```csharp
var highLevelWarriors = characters
                            .Where(c => c.Class == "Warrior" && c.Level > 6)
                            .Select(c => c.Name)
                            .ToList();
```            
**Output**:

*   Gimli
*   Boromir

---

Example: Order Characters by Name
---------------------------------
```csharp
var orderedByName = characters.OrderBy(c => c.Name).ToList();

foreach(var character in orderedByName)
{
    Console.WriteLine($"{character.Name} - Level {character.Level}");
}
```            
**Output**:

*   Aragorn - Level 10
*   Boromir - Level 7
*   Frodo - Level 5
*   Gimli - Level 8
*   Legolas - Level 9

---

Example: Check if Any Mage Exists
---------------------------------
```csharp
bool hasMage = characters.Any(c => c.Class == "Mage");

Console.WriteLine(hasMage ? "Mage found." : "No Mage in the list.");
```            
**Output**:

No Mage in the list.

---

Example: Select Only Names and Levels
-------------------------------------
```csharp
var nameAndLevel = characters.Select(c => new { c.Name, c.Level });

foreach(var c in nameAndLevel)
{
    Console.WriteLine($"Name: {c.Name}, Level: {c.Level}");
}
```            
**Output**:

*   Name: Aragorn, Level: 10
*   Name: Legolas, Level: 9
*   Name: Gimli, Level: 8
*   Name: Boromir, Level: 7
*   Name: Frodo, Level: 5

---

LINQ Query vs. Method Syntax
----------------------------

### Query Syntax
```csharp
var highLevelCharacters = from c in characters
                            where c.Level > 6
                            select c;
```            
### Method Syntax
```csharp
var highLevelCharacters = characters
                            .Where(c => c.Level > 6)
                            .Select(c => c);
```            
**Note**: Both achieve the same result; choice depends on developer preference.

---

When to Use LINQ
----------------

*   When querying collections or databases.
*   To simplify complex data manipulations.
*   When readability and maintainability are priorities.
*   To leverage functional programming paradigms in C#.

---

Tips for Using LINQ
-------------------

*   **Use method chaining** for readability.
*   **Leverage lambda expressions** for concise predicates.
*   **Be mindful of performance** with large datasets.
*   **Understand deferred execution**: Queries are executed when iterated.
*   **Use `ToList()` or `ToArray()`** to force immediate execution if needed.

---

String Interpolation in C#
--------------------------

Enhances readability when displaying query results.

### Basic Example
```csharp
string name = "Aragorn";
int level = 10;

Console.WriteLine($"Character: {name}, Level: {level}");
```            

**Output**:

Character: Aragorn, Level: 10

---

### Formatting Numbers
```csharp
decimal gold = 1234.56m;
Console.WriteLine($"Gold: {gold:C}");
```            

**Output**:

Gold: $1,234.56

---

### Padding and Alignment
```csharp
string name = "Legolas";
int level = 9;

Console.WriteLine($"Name: {name,-10} | Level: {level,5}");
```            
**Output**:
Name: Legolas | Level: 9

---

Combining LINQ with String Interpolation
----------------------------------------
```csharp
var highLevelCharacters = characters.Where(c => c.Level > 6);

foreach(var c in highLevelCharacters)
{
    Console.WriteLine($"Name: {c.Name}, Class: {c.Class}, Level: {c.Level}");
}
```            
**Output**:

*   Name: Aragorn, Class: Ranger, Level: 10
*   Name: Legolas, Class: Archer, Level: 9
*   Name: Gimli, Class: Warrior, Level: 8
*   Name: Boromir, Class: Warrior, Level: 7

---

### IEnumerable vs. IList vs. List
**IEnumerable**
- Represents a forward-only cursor of a collection.
- Suitable for querying large datasets with deferred execution.
- Does not support indexing.

**IList**
- Inherits from IEnumerable.
- Supports indexing and allows random access.
- Suitable for collections that require frequent read and write operations.

**List**
- Implements IList.
- Provides additional functionalities like sorting and searching.
- Suitable for most collection operations in C#.

**Example**
```csharp
IEnumerable<int> enumerable = new List<int> { 1, 2, 3 };
IList<int> ilist = new List<int> { 1, 2, 3 };
List<int> list = new List<int> { 1, 2, 3 };
```
---

Additional Resources
--------------------

*   [Official LINQ Documentation](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/linq/)
*   [String Interpolation in C#](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/tokens/interpolated)
*   [LINQ Tutorial](https://www.tutorialsteacher.com/linq)
---

Thank You!
==========

Feel free to reach out with any questions.