---
title: Go Data Structures
type: techniques
created: 2014-07-15
last_updated: 2026-04-15
related: ["[[Go JSON Parsing]]", "[[BaiduYunPush]]", "[[Bloom Filter]]", "[[Search Engine Crawlers]]", "[[Go Slices]]", "[[Go Performance Optimization]]", "[[Go BitSet]]", "[[Go Graphs]]", "[[Cantor Pairing Function]]"]
sources: ["b904756713d5", "86cbbdcd94ff", "46f52267e85e", "303bceb2ee84", "642807fd179d", "70ea69c7afa8"]
---

# Go Data Structures

## HashSet

In July 2014, the subject needed to deduplicate a list of strings in Go. After reviewing Java's `HashSet` implementation, the subject adapted a community solution into a simple hash set backed by a Go map.

```go
type HashSet struct {
    set map[string]bool
}

func NewHashSet() *HashSet {
    return &HashSet{make(map[string]bool)}
}

func (set *HashSet) Add(i string) bool {
    _, found := set.set[i]
    set.set[i] = true
    return !found
}

func (set *HashSet) Get(i string) bool {
    _, found := set.set[i]
    return found
}

func (set *HashSet) Remove(i string) {
    delete(set.set, i)
}
```

The map keys serve as the hash values, and the boolean values track membership.

### Empty Struct Optimization

In April 2017, the subject replaced the `bool` value with an empty struct (`struct{}`) to eliminate unnecessary memory overhead. A `struct{}` occupies zero bytes, and the Go compiler maps all zero-size variables to `runtime.zerobase`. Benchmarks showed a modest speed improvement (roughly 35 ns/op versus 41 ns/op) and a significant memory reduction—reportedly shaving about 1.6 GB in a memory-intensive production service.

```go
var itemExists = struct{}{}

type Set struct {
    items map[interface{}]struct{}
}

func (set *Set) Add(item interface{}) {
    set.items[item] = itemExists
}
```

## Integer Types and Architecture

In December 2017, the subject documented the architecture-dependent size of Go's `int` and `uint` types. The Go specification states that `int` is at least 32 bits wide, but the actual size is chosen by the implementation. As of Go 1.1, both the `gc` and `gccgo` compilers use 64 bits for `int` and `uint` on 64-bit platforms (such as AMD64), while 32-bit platforms retain a 32-bit width.

This means that code such as:

```go
var a uint = math.MaxUint64
```

compiles on a 64-bit machine but fails on a 32-bit machine with an overflow error. Programs that require a fixed width should use `int32`, `uint32`, `int64`, or `uint64` explicitly.

Two standard ways to detect the current integer size at runtime are:

- `runtime.GOARCH` — reports the target architecture (e.g., `amd64`, `386`).
- `strconv.IntSize` — reports the bit width of `int` (32 or 64).

The standard library also exploits this property internally. For example, `strconv.Itoa` uses the following constant to branch on 32-bit versus 64-bit platforms:

```go
const host32bit = ^uint(0)>>32 == 0
```

See also:
- [[Go BitSet]]
- [[Go Graphs]]
- [[Cantor Pairing Function]]
