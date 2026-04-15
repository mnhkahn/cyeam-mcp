---
title: Redis Data Structures
type: techniques
created: 2015-09-15
last_updated: 2015-09-15
related: ["[[Go Strings]]", "[[Go Data Structures]]", "[[C Program Compilation]]"]
sources: ["b2bc6dbdf874"]
---

# Redis Data Structures

## Simple Dynamic String (SDS)

Redis is implemented in C, but it does not use C's native null-terminated character arrays for string values. Instead, it defines a custom type called the Simple Dynamic String (SDS). The structure is:

```c
struct sdshdr {
    int len;      // number of bytes currently used
    int free;     // number of unused bytes allocated
    char buf[];   // flexible array member holding the string
};
```

### Design Rationale

The `len` field allows `strlen`-equivalent operations to run in `O(1)` time, trading a small amount of memory for constant-time length queries. The `free` field implements pre-allocation: when a string is expanded, Redis allocates more space than immediately required, so subsequent append operations can often write into the reserved buffer without triggering a reallocation. This amortizes the cost of growth and avoids the repeated `O(n)` copies that would occur with a naive C string.

### Compatibility

The `buf` array is still null-terminated so that SDS can be passed directly to standard C library functions that expect `char*`. However, Redis never relies on the null terminator internally; all operations use the explicit `len` field, which means SDS can safely store binary data containing embedded zero bytes.

### Comparison with Go Strings

Go strings also store an explicit length, but they are immutable. Any modification requires allocating a new backing array. Redis SDS is mutable and uses the `free` buffer to reduce reallocation frequency during repeated writes. When the pre-allocated `free` space is exhausted, SDS falls back to an allocation and copy similar to Go's behavior.
