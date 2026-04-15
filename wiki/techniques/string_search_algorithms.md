---
title: String Search Algorithms
type: techniques
created: 2014-08-08
last_updated: 2015-01-15
related: ["[[Hash Functions]]", "[[Go Slices]]", "[[Go Strings]]"]
sources: ["dc891d96fa19", "3db21f681889"]
---

# String Search Algorithms

String search (or substring search) is the problem of finding the first occurrence of a pattern within a text. The naive approach scans every position, while more advanced algorithms reduce average-case complexity.

## Brute Force

The brute-force algorithm compares the pattern character by character at each position in the text. Its worst-case time complexity is $O(n \cdot m)$, where $n$ is the text length and $m$ is the pattern length.

## Rabin–Karp

The Rabin–Karp algorithm uses a rolling hash to achieve $O(n)$ average-case time. The pattern is hashed once; then a sliding window of the same length is hashed across the text. If the hash values match, a direct comparison confirms the match to rule out hash collisions.

### Hash Function

Go's `strings` package treats the string as a number in base `primeRK` (16,776,19) and computes its value modulo $2^{32}$:

```go
const primeRK = 16777619

func hashstr(sep string) (uint32, uint32) {
    hash := uint32(0)
    for i := 0; i < len(sep); i++ {
        hash = hash*primeRK + uint32(sep[i])
    }
    var pow, sq uint32 = 1, primeRK
    for i := len(sep); i > 0; i >>= 1 {
        if i&1 != 0 {
            pow *= sq
        }
        sq *= sq
    }
    return hash, pow
}
```

In January 2015, the subject recognized that `primeRK` is the FNV-1 32-bit prime ($2^{24} + 2^8 + 0x93$). Go's string-search hash therefore resembles the FNV-1a hash: it treats the input as a large integer in base `primeRK` and keeps the lower 32 bits, which is equivalent to computing modulo $2^{32}$ because the result is stored in a `uint32`.

### Rolling Update

When the window slides one character to the right, the old leading character is removed and the new trailing character is added in constant time:

```go
h *= primeRK
h += uint32(s[i])
h -= pow * uint32(s[i-n])
```

Because hash collisions are possible, Go verifies every hash match with a direct string comparison (`s[:n] == sep`). This makes the overall complexity $O(m + n)$ in the worst case, while retaining the fast $O(n)$ average case.

Go's implementation uses 32-bit unsigned arithmetic, allowing overflow to wrap naturally without an explicit modulus. The constant 16,776,19 equals $2^{24} + 403$.
