---
title: Go Slices
type: techniques
created: 2014-08-07
last_updated: 2018-06-18
related: ["[[Go for Loop]]", "[[Go Data Structures]]", "[[Go Binary Encoding]]"]
sources: ["8814f025d4aa", "0de19dd4da92", "e8f0c8af12f2"]
---

# Go Slices

A slice in Go is a dynamically-sized, flexible view into an array. Common operations include appending, copying, and concatenating slices.

## copy

The built-in `copy` function copies elements from a source slice to a destination slice, returning the number of elements copied. It copies starting at the beginning of the destination; to append, the destination index must be specified explicitly.

```go
a := []int{1, 2, 3, 4}
b := []int{5, 6, 7}
c := make([]int, len(a)+len(b))
copy(c, a)
copy(c[len(a):], b)
```

`copy` does not allocate memory; if the destination is too short, only the fitting elements are copied.

## append with Variadic Arguments

The built-in `append` function is more concise for concatenation. It accepts a variadic trailing argument, so one slice can be appended to another by unpacking it with `...`:

```go
a := []int{1, 2, 3, 4}
b := []int{5, 6, 7}
d := append(a, b...)
```

`append` may allocate a new backing array if the capacity of the original slice is insufficient. The resulting slice contains all elements of `a` followed by all elements of `b`.

## Pass-by-Value Semantics

In January 2016, the subject documented a common pitfall arising from the fact that a slice is a struct value containing a pointer, a length, and a capacity. When a slice is passed to a function, the struct itself is copied by value, but the underlying array pointer is shared. This means that modifications that overwrite existing elements are visible to the caller, while operations that change the slice header—such as `append`—are not.

```go
func FuckSlice(a []int64) []int64 {
    a = append(a, 1)
    return a
}

func main() {
    s := []int64{}
    FuckSlice(s)
    // s is still empty because the append updated the local copy of the header
}
```

To propagate append results back to the caller, pass a pointer to the slice:

```go
func FuckSlice2(a *[]int64) *[]int64 {
    *a = append(*a, 1)
    return a
}
```

This behavior differs from maps, which are reference types: a map passed by value can be modified in place without needing a pointer.

## Slice Tricks

In June 2018, the subject translated and annotated the official Go wiki "SliceTricks" page, documenting common idioms for manipulating slices.

### Append and Copy

Append one slice to another:

```go
a = append(a, b...)
```

Copy a slice:

```go
b = make([]T, len(a))
copy(b, a)
// or
b = append([]T(nil), a...)
```

### Cut, Delete, and Insert

Cut elements `[i, j)`:

```go
a = append(a[:i], a[j:]...)
```

Delete element at index `i`:

```go
a = append(a[:i], a[i+1:]...)
// or
a = a[:i+copy(a[i:], a[i+1:])]
```

Delete without preserving order (avoids copying):

```go
a[i] = a[len(a)-1]
a = a[:len(a)-1]
```

To prevent memory leaks when the slice contains pointers, nil out the discarded elements before truncating:

```go
copy(a[i:], a[i+1:])
a[len(a)-1] = nil
a = a[:len(a)-1]
```

Insert element `x` at index `i`:

```go
a = append(a, 0)
copy(a[i+1:], a[i:])
a[i] = x
```

### Stack and Queue Operations

Pop front:

```go
x, a = a[0], a[1:]
```

Pop back:

```go
x, a = a[len(a)-1], a[:len(a)-1]
```

Push back:

```go
a = append(a, x)
```

Push front:

```go
a = append([]T{x}, a...)
```

### In-Place Filtering

Reuse the backing array to filter without allocating a new slice:

```go
b := a[:0]
for _, x := range a {
    if f(x) {
        b = append(b, x)
    }
}
```

After this operation, `b` holds the filtered elements and `a` shares the same backing array but contains stale data past `len(b)`.

### Reversal and Shuffling

Reverse in place:

```go
for left, right := 0, len(a)-1; left < right; left, right = left+1, right-1 {
    a[left], a[right] = a[right], a[left]
}
```

Shuffle with the Fisher–Yates algorithm:

```go
for i := len(a) - 1; i > 0; i-- {
    j := rand.Intn(i + 1)
    a[i], a[j] = a[j], a[i]
}
```

## References

The subject recommended reading [Effective Go](https://golang.org/doc/effective_go.html) for idiomatic slice usage.
