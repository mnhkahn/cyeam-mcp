---
title: Go for Loop
type: techniques
created: 2014-08-06
last_updated: 2018-10-30
related: ["[[Go Data Structures]]", "[[Go Slices]]", "[[Go Strings]]", "[[Go Concurrency]]"]
sources: ["206b01bb8b04", "10242f1c45b6"]
---

# Go for Loop

Go supports two primary styles of `for` loop: the traditional C-style index loop and the range-based loop.

## Traditional Index Loop

```go
for i := 0; i < count; i++ {
    // use i to index the collection
}
```

This form allows direct mutation of the underlying array or slice because the element is accessed by index.

## Range Loop

```go
for i, v := range collection {
    // i is the index, v is a copy of the element
}
```

The range loop is concise and commonly preferred in Go for read-only traversal. However, the loop variable `v` is a copy of the element, not a reference to it. Modifying `v` does not affect the original collection.

## Mutation Pitfall

The subject encountered a bug when attempting to modify slice elements inside a range loop:

```go
for _, aa := range a {
    aa += "@"
}
```

Because `aa` is re-used across iterations, its address remains constant and its value is copied from the slice. The original slice is unchanged. The fix is to use an index loop:

```go
for i := 0; i < len(a); i++ {
    a[i] += "@"
}
```

The same behavior exists in Java's enhanced for-each loop.

## Range Loop Internals

In October 2018, the subject examined how the Go compiler lowers `for range` loops into equivalent C-style loops. The lowering reveals why certain patterns behave unexpectedly.

### Slice Range Lowering

A `for range` over a slice is rewritten so that the length is captured once before the loop begins:

```go
for_temp := range
len_temp := len(for_temp)
for index_temp = 0; index_temp < len_temp; index_temp++ {
    value_temp = for_temp[index_temp]
    index = index_temp
    value = value_temp
    // original body
}
```

Because `len_temp` is fixed at loop entry, appending to the slice inside the loop does not create an infinite loop.

### Reused Loop Variable

The lowered form also shows why taking the address of the range value produces identical pointers across iterations. The compiler uses a single temporary variable (`value_temp`) and copies it into the user-visible `value` variable each iteration. Consequently, code such as:

```go
for index, value := range slice {
    myMap[index] = &value
}
```

stores the same address for every entry, and dereferencing those addresses later yields the last element of the slice.

### Other Collection Types

- **Array**: similar to slice, but the entire array is copied into a temporary before looping.
- **Map**: uses an internal `hiter` struct initialized with `mapiterinit` and advanced with `mapiternext`.
- **Channel**: compiles to an infinite loop that receives values until the channel is closed.
- **String**: iterates by byte index, decoding multi-byte UTF-8 runes with `decoderune` as needed.
