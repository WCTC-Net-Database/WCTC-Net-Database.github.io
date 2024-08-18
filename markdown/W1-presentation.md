---
marp: true
theme: wctc
style: |
  @import 'wctc-theme.css';
---
![WCTC Logo](https://www.wctc.edu/Files/waukesha_logo.svg)

#  .Net Database Week 1 Curriculum
*Instructor: Mark McArthey*

---

# Introduction to C#
## Overview of C# and Console Applications

---

### What is C#?
- C# is a modern, object-oriented, and type-safe programming language developed by Microsoft.
- It is part of the .NET framework, making it versatile for various types of applications.

---

### Basics of C# Programming

#### Variables and Data Types
- **Variables** store data to be referenced and manipulated in programs.
- Common **data types** include `int`, `string`, `bool`, and `double`.

#### Operators
- **Arithmetic operators** (+, -, *, /)
- **Comparison operators** (==, !=, >, <)
- **Logical operators** (&&, ||, !)

---

### Control Structures

#### Decision Making
- `if`, `else if`, `else`
- `switch` statements

#### Loops
- `for`: Iterates a set number of times.
- `foreach`: Iterates over items in a collection.
- `while`: Continues as long as a condition is true.
- `do while`: Similar to `while`, but checks condition after the loop.

---

### Collections in C#

#### Arrays
- Fixed size, same data type collection.
  
#### Lists
- Dynamic size, same data type collection.
- Part of `System.Collections.Generic`.

---

### Functions in C#
- Encapsulate reusable code blocks.
- Can return a value or be void.

---

### Exception Handling
- `try`, `catch`, `finally` blocks handle exceptions.
- Ensures graceful handling of runtime errors.

---

### File I/O Operations
- Reading and writing files is essential for data management.
- `System.IO` namespace provides tools for file operations.

```csharp
using System.IO;

string text = File.ReadAllText("file.txt");
File.WriteAllText("output.txt", text);
```

---
### Additional Resources for Learning C#

#### Official Microsoft C# Documentation
- Comprehensive resource for all C# features, from basic to advanced.
- [Microsoft C# Docs](https://docs.microsoft.com/en-us/dotnet/csharp/)

#### Tutorials and Code Examples
- **TutorialsPoint** - Easy-to-follow tutorials on C# basics and advanced topics.
  - [TutorialsPoint C#](https://www.tutorialspoint.com/csharp/index.htm)
- **DotNet Perls** - Offers detailed tutorials and practical examples on various C# concepts.
  - [DotNet Perls](https://www.dotnetperls.com/)

#### Interactive Learning Platforms
- **Microsoft Learn** - Interactive modules and learning paths tailored to using C# in different scenarios.
  - [Microsoft Learn for C#](https://docs.microsoft.com/en-us/learn/paths/csharp-first-steps/)
- **Codecademy** - Provides an interactive course where you can write C# code in a browser-based environment.
  - [Codecademy C# Course](https://www.codecademy.com/learn/learn-c-sharp)

#### Books
- **"C# 9.0 in a Nutshell"** by Joseph Albahari - A comprehensive guide to the C# language and its uses.
- **"The C# Player's Guide"** by RB Whitaker - A beginner-friendly guide to learning C#, great for those starting out.

#### Online Courses
- **Udemy** - Various courses ranging from beginner to advanced levels, often with comprehensive projects and downloadable resources.
  - [Udemy C# Courses](https://www.udemy.com/topic/c-sharp/)
- **Pluralsight** - Known for its deep-dive courses into C# and .NET technologies.
  - [Pluralsight C# Courses](https://www.pluralsight.com/courses/csharp-fundamentals-dev)

#### Community and Forums
- **Stack Overflow** - A vast community of developers where you can ask questions and share knowledge about C# programming.
  - [Stack Overflow](https://stackoverflow.com/questions/tagged/c%23)
- **GitHub** - Explore open-source C# projects to see how other developers use the language.
  - [GitHub C# Projects](https://github.com/topics/c-sharp)

#### YouTube Channels
- **.NET Microsoft** - Official channel with tutorials, product announcements, and community content.
  - [.NET Microsoft YouTube](https://www.youtube.com/user/VisualStudio)
- **IAmTimCorey** - Focuses on practical C# tutorials and projects.
  - [IAmTimCorey YouTube](https://www.youtube.com/user/IAmTimCorey)



---

### Summary: Key Takeaways from Today's Session on C#

- **C# Fundamentals**: We've covered the basics such as variables, data types, control structures, and loops. Understanding these will help you build robust applications.

- **Console Applications**: You've learned how to create simple console applications in C#. These serve as a great starting point for beginner programmers to understand the flow of a C# program.

- **File I/O**: Handling file input and output is critical for many real-world applications. Today's introduction should help you manage data effectively in your future projects.

- **Practice and Persistence**: Like any programming language, proficiency in C# comes with practice. Utilize the exercises and resources provided to enhance your understanding and skills.

- **Community and Continual Learning**: Engage with the C# community and continue learning through the resources shared. Staying updated and interacting with other developers will greatly aid your growth.

#### Keep Coding!
Keep experimenting with what you've learned today. Build small projects, contribute to open source, and don't hesitate to reach out for help when you need it. Happy coding!

