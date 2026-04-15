---
title: Go Interfaces
type: techniques
created: 2014-07-20
last_updated: 2014-07-20
related: ["[[Go flag Package]]", "[[Go Data Structures]]", "[[Apache Thrift in Go]]"]
sources: ["bcf076edc9d8"]
---

# Go Interfaces

Go uses implicit interfaces: a type implements an interface by defining the required methods, without explicit declaration. This design avoids the ceremony of Java's `implements` keyword while still providing polymorphism.

## Syntax Comparison

| Concept | Go | Java |
|---|---|---|
| Interface definition | `type Phone interface { ... }` | `interface Phone { ... }` |
| Implementing type | `type iPhone struct { ... }` | `class iPhone implements Phone { ... }` |
| Method implementation | `func (p *Android) Company() string { ... }` | `String Company() { ... }` |

## Example

```go
type Phone interface {
    Company() string
}

type Android struct{}

func (p *Android) Company() string {
    return "Google"
}

type iPhone struct{}

func (p *iPhone) Company() string {
    return "Apple"
}

func main() {
    android := Android{}
    iphone := iPhone{}
    println(android.Company())
    println(iphone.Company())
}
```

Output:

```
Google
Apple
```

## Design Philosophy

Go is not a class-based object-oriented language. The subject noted that Go borrows useful object-oriented concepts—such as interfaces—without the full complexity of traditional OO syntax, aligning with Go's reputation as a procedural language with selective modern features.
