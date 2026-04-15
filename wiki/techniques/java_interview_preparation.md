---
title: Java Interview Preparation
type: techniques
created: 2014-01-02
last_updated: 2014-01-02
related: ["[[C++ Memory and Objects]]", "[[HTTP Protocol Analysis]]"]
sources: ["aa9399e00d3a"]
---

# Java Interview Preparation

In late 2013 and early 2014, the subject compiled extensive notes while interviewing for Java programmer positions. The notes cover language fundamentals, core library classes, collections, I/O, and Servlets.

## Language Fundamentals

- **Identifiers** cannot start with a digit, cannot contain `@` or `-`, and are case-sensitive. Chinese characters are valid.
- **Primitive types** include `boolean`, `char`, `byte`, `short`, `int`, `long`, `float`, `double`, and `void`. Each has a corresponding wrapper class.
- **Variable initialization** is strict: local variables must be initialized before use, and narrowing assignments such as `float f = 0.0` (where `0.0` is `double`) fail to compile.
- **Shift operators** include the unsigned right shift `>>>` which always fills with 0, and the signed right shift `>>` which propagates the sign bit.
- **`==` vs `equals()`** — `==` compares values for primitives and memory addresses for references. `equals()` is defined in `Object` and defaults to address comparison; it can be overridden to compare content.
- **Parameter passing** is always by value. For objects, the value passed is the reference address; the object itself can be modified but the reference cannot be reassigned to affect the caller.

## Object-Oriented Mechanics

- **Overloading** requires the same method name with different parameter lists. Return type alone cannot distinguish overloads.
- **Overriding** in subclasses requires identical method signatures, return types, and parameter lists. The overriding method cannot reduce access visibility or broaden checked exceptions.
- **Constructor chaining** — subclass constructors implicitly call `super()` as their first statement unless `this()` is used. If the parent defines only parameterized constructors, `super()` with appropriate arguments must be supplied.
- **`final`, `finally`, `finalize`** — `final` prevents modification, overriding, or inheritance; `finally` executes after `try/catch` regardless of outcome; `finalize()` is called by the garbage collector before reclaiming an object.

## Collections Framework

The `java.util` collections divide into `Collection` (lists and sets) and `Map` (key-value stores).

### List Implementations

- **ArrayList** — dynamic array, default capacity 10, grows by 1.5x. Fast random access; slow insertions and deletions in the middle.
- **LinkedList** — doubly linked list. Fast insertions and deletions; slow indexed access.
- **Vector** — synchronized dynamic array, grows by 2x.

### Set Implementations

- **HashSet** — hash table, optimized for fast lookup. Elements must implement `hashCode()`.
- **TreeSet** — red-black tree, maintains sorted order. Elements must implement `Comparable`.
- **LinkedHashSet** — hash table with linked-list ordering, preserving insertion sequence.

### Map Implementations

- **HashMap** — unsynchronized hash table using chaining for collision resolution. Introduced in Java 2.
- **Hashtable** — synchronized legacy dictionary subclass.
- **TreeMap** — red-black tree implementation supporting ordered traversal and sub-map extraction.

## I/O Architecture

Java I/O uses the Decorator pattern to compose streams with layered functionality. The hierarchy splits into byte streams (`InputStream`/`OutputStream`) and character streams (`Reader`/`Writer`), with the latter handling automatic character encoding conversion.

## Servlets

The Servlet lifecycle consists of: loading, instantiation, single `init()` call, per-request `service()` execution (creating `request` and `response` objects), and final `destroy()` when the server removes the Servlet. Forwarding (`RequestDispatcher.forward`) happens server-side; redirecting (`HttpServletResponse.sendRedirect`) returns a new URL to the client.
