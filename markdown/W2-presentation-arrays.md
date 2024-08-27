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
## Week 2 Curriculum - Arrays
*Instructor: Mark McArthey*

---

## Introduction

Welcome to Week 2! This week, you'll dive into two fundamental concepts in programming: arrays and file handling. These topics are crucial as you begin to build more complex programs. Let's get started!

---

## Arrays in C#
- **Definition**: An array is a collection of elements, all of the same type, stored in a contiguous block of memory. Think of it as a list where you can store multiple items, but all the items must be of the same type (e.g., all integers or all strings).
- **Declaration**: 
    ```csharp
    int[] numbers = new int[5];
    ```
- **Initialization**:
    ```csharp
    int[] numbers = {1, 2, 3, 4, 5};
    ```

---

## Accessing Array Elements
- **Indexing**: You can access elements in an array using their index. Remember, arrays are zero-indexed, meaning the first element is at index 0.
    ```csharp
    int firstNumber = numbers[0];
    ```
- **Looping through Arrays**:
    ```csharp
    for (int i = 0; i < numbers.Length; i++) {
        Console.WriteLine(numbers[i]);
    }
    ```

---
## Modifying Array Elements
- You can change the value of an element in an array by assigning a new value to it using its index.
    ```csharp
    ages[2] = 36; // Changes the third element to 36
    ```
---

## Multi-Dimensional Arrays
- **Declaration**:
    ```csharp
    int[,] matrix = new int[3, 3];
    ```
- **Initialization**:
    ```csharp
    int[,] matrix = {
        {1, 2, 3},
        {4, 5, 6},
        {7, 8, 9}
    };
    ```

---
## Looping Through Arrays
Arrays are often used in conjunction with loops to process each element. A for loop is commonly used for this purpose.
```csharp
for (int i = 0; i < ages.Length; i++)
{
    Console.WriteLine(ages[i]);
}
```
You can also use a foreach loop for simpler iteration:
```csharp
foreach (int age in ages)
{
    Console.WriteLine(age);
}
```
---

## Jagged Arrays
- **Definition**: An array of arrays.
- **Declaration**:
    ```csharp
    int[][] jaggedArray = new int[3][];
    ```
- **Initialization**:
    ```csharp
    jaggedArray[0] = new int[] {1, 2};
    jaggedArray[1] = new int[] {3, 4, 5};
    jaggedArray[2] = new int[] {6, 7, 8, 9};
    ```

---

## File Handling in C#
- **Reading from a File**:
    ```csharp
    string[] lines = File.ReadAllLines("file.txt");
    foreach (string line in lines) {
        Console.WriteLine(line);
    }
    ```
- **Writing to a File**:
    ```csharp
    string[] lines = {"First line", "Second line"};
    File.WriteAllLines("file.txt", lines);
    ```

---

## Directory Management
- **Creating a Directory**:
    ```csharp
    Directory.CreateDirectory("new_directory");
    ```
- **Checking if a Directory Exists**:
    ```csharp
    if (Directory.Exists("new_directory")) {
        Console.WriteLine("Directory exists.");
    }
    ```

---

## Handling Special Cases in CSV Files
### Quoted Strings and Commas
**Problem**: Simple `Split(',')` fails with fields like `"Doe, John",30,"New York"`.
**Solution**: Use a more robust approach to correctly handle commas within quoted strings.
```csharp
using Microsoft.VisualBasic.FileIO;
using System.IO;

string csvLine = "\"Doe, John\",30,\"New York\"";
using (TextFieldParser parser = new TextFieldParser(new StringReader(csvLine)))
{
    parser.TextFieldType = FieldType.Delimited;
    parser.SetDelimiters(",");
    string[] fields = parser.ReadFields();
    foreach (string field in fields)
    {
        Console.WriteLine(field);
    }
}
```
---

## Using TextFieldParser for CSV Parsing
### What is TextFieldParser?
- A class in the Microsoft.VisualBasic.FileIO namespace designed to read structured text files.
- Handles delimited (e.g., CSV) and fixed-width files.
- Automatically manages quoted fields and delimiters, making it ideal for complex CSV files.
- For pure C# projects, consider writing custom parsing logic or using a third-party library.
```csharp
using Microsoft.VisualBasic.FileIO;

string csvLine = "\"Doe, John\",30,\"New York\"";
using (TextFieldParser parser = new TextFieldParser(new StringReader(csvLine)))
{
    parser.TextFieldType = FieldType.Delimited;
    parser.SetDelimiters(",");
    string[] fields = parser.ReadFields();
    foreach (string field in fields)
    {
        Console.WriteLine(field);
    }
}
```
---

## Using CsvHelper Library for Advanced Parsing
- **CsvHelper**: A third-party library that simplifies parsing CSV files, handling complex cases.
- **Installation**:
    ```bash
    dotnet add package CsvHelper
    ```
- **Reading CSV with CsvHelper**:
    ```csharp
    using (var reader = new StreamReader("file.csv"))
    using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture)) {
        var records = csv.GetRecords<MyClass>().ToList();
    }
    ```
- **Writing CSV with CsvHelper**:
    ```csharp
    using (var writer = new StreamWriter("file.csv"))
    using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture)) {
        csv.WriteRecords(records);
    }
    ```

---

## Summary
- **Arrays**: Essential for handling collections of data.
- **File Handling**: Crucial for reading and writing data to files.
- **Directory Management**: Important for organizing files.
- **File Properties**: Useful for managing file attributes and metadata.

---

## Additional Resources
- **Official C# Documentation**: [docs.microsoft.com/en-us/dotnet/csharp/](https://docs.microsoft.com/en-us/dotnet/csharp/)
- **CsvHelper Documentation**: [joshclose.github.io/CsvHelper/](https://joshclose.github.io/CsvHelper/)
- **C# Programming Guide**: [docs.microsoft.com/en-us/dotnet/csharp/programming-guide/](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/)

---

## Final Thoughts
- Practice makes perfect.
- Experiment with different array and file handling techniques.
- Utilize libraries like CsvHelper to simplify complex tasks.

---