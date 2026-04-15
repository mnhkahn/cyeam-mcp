---
title: Bitwise Operations
type: techniques
created: 2013-03-11
last_updated: 2013-03-11
related: ["[[Sorting Algorithms]]", "[[C++ Memory and Objects]]", "[[Go BitSet]]"]
sources: ["5b7ed36bd563"]
---

# Bitwise Operations

## Core Operators

| Operator | Name | Behavior |
|----------|------|----------|
| `&` | AND | Result is 1 only if both bits are 1. Used to mask (clear) specific bits. |
| `\|` | OR | Result is 1 if either bit is 1. Used to set specific bits to 1. |
| `^` | XOR | Result is 1 if bits differ. Equivalent to addition without carry. |
| `<<` | Left shift | Shifts bits left, filling with 0 on the right. `n << k` equals `n * 2^k`. |
| `>>` | Right shift | Shifts bits right. For positive numbers, fills with 0; for negative numbers, fills with 1 (sign-propagating). |
| `~` | NOT | Inverts all bits. |

## Common Patterns

- **Set bit x**: `n |= 1 << x`
- **Clear bit x**: `n &= ~(1 << x)`
- **Toggle bit x**: `n ^= 1 << x`
- **Check bit x**: `if (n & (1 << x))`

## XOR Properties

XOR has useful algebraic properties:

- `A ^ 0 = A`
- `A ^ A = 0`
- Self-inverse: `A ^ B ^ A = B`

These properties enable the XOR swap algorithm and solutions to problems such as finding a single non-repeated element in an array.

## Addition Without Arithmetic Operators

Because XOR performs bit-wise addition without carry, and AND followed by left shift computes the carry, two integers can be added using only bitwise operations:

```
sum = a ^ b
carry = (a & b) << 1
```

Repeat until carry becomes zero.
