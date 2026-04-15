---
title: C++ Memory and Objects
type: techniques
created: 2013-03-11
last_updated: 2013-04-02
related: ["[[Bitwise Operations]]", "[[Sorting Algorithms]]", "[[Windows Concurrency]]"]
sources: ["5b7ed36bd563", "ed45cf657147", "727ca91a11c7", "9b3561b0fbb2", "f8f56b3d3100", "1cb8d7651d30", "7904c05cf552"]
---

# C++ Memory and Objects

## Memory Allocation

C++ programs use three primary memory regions:

- **Static storage** — for global and `static` variables. Initialized globals live in `.data`; uninitialized globals and statics live in `.bss` (zeroed by default). These persist for the program's entire lifetime.
- **Stack** — for local variables and function parameters. Allocated on function entry and automatically freed on return.
- **Heap** — for dynamic allocation via `new`/`delete` or `malloc`/`free`. The programmer manages lifetime. Failure to release heap memory causes leaks. STL containers such as `vector` allocate on the heap.

## Strings and Character Arrays

A C-style string is a character array terminated by `\0`. A character array without the terminator is not a valid string. Passing an unterminated character array to string functions such as `strlen` causes undefined behavior because traversal continues past the array boundary.

When a string literal initializes a character array, the array length includes the implicit terminator. A character pointer (`char *`) initialized with a string literal stores the address of that literal; `sizeof` on the pointer returns the pointer size, not the string length.

## The `sizeof` Operator

`sizeof` is a compile-time unary operator, not a function. It returns the size in bytes of a type, variable, expression, or function return type without evaluating the operand at runtime. Key behaviors:

- All data pointers return 4 (on the platform described).
- `sizeof` on a variable does not require parentheses.
- `sizeof(function_call())` returns the size of the return type without executing the function.

## `static` Data Members

`static` data members are shared across all instances of a class. They exist outside any individual object and must be defined exactly once outside the class body. Because they are not initialized by constructors, they cannot rely on the constructor for setup. `const static` members can be initialized inside the class definition, but still require an external definition.

## Constructor Initialization Lists

True initialization in C++ occurs in the initialization list before the constructor body executes. Using assignment inside the constructor body is less efficient because it invokes default construction followed by assignment. Initialization lists are required for:

- Non-static `const` members
- Base class construction in derived classes
- Members without default constructors

Initialization order follows the declaration order in the class, not the order in the initialization list.

## The `const` Keyword

`const` enforces immutability at multiple levels:

- **Const variable** — value cannot be modified after initialization.
- **Const reference parameter** — avoids copying and construction overhead while preventing modification.
- **Const return value** — prevents accidental assignment to the return value.
- **Const member function** — guarantees the function does not modify the object's state.
- **Pointer to const** — the pointed-to value is immutable (`const double *ptr` or `double const *ptr`).
- **Const pointer** — the pointer itself cannot change address (`int * const a`).
