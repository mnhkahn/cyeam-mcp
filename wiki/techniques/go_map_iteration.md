---
title: Go Map Iteration
type: techniques
created: 2014-08-25
last_updated: 2024-10-30
related: ["[[Go Data Structures]]", "[[API Security]]", "[[Go for Loop]]", "[[Go Garbage Collection]]"]
sources: ["2e15f9afdba5", "073aca4d98d7"]
---

# Go Map Iteration

Go maps are unordered collections of key-value pairs. Iteration order over a map is not guaranteed and, starting with Go 1.3, is intentionally randomized to prevent reliance on a fixed order.

## Non-Deterministic Order

The subject encountered a bug when iterating over a map twice: once to build a request URL and once to compute a signature. Because map iteration order varies, the two traversals could produce different parameter orderings, causing signature mismatches.

In a test of 100 iterations over a three-element map, only three distinct orderings appeared (e.g., `012`, `120`, `201`), with one ordering dominating (~82%). This non-uniform distribution made the bug intermittent and difficult to detect during casual testing.

## Implications

Any operation that requires a stable key order—such as canonical signing, caching, or reproducible serialization—must sort the keys explicitly before processing. Relying on map iteration order for deterministic behavior is a known source of bugs in Go programs.

## Deletion and Memory Behavior

In October 2024, the subject analyzed how `delete` works inside the Go runtime. The `delete` function marks the bucket cell as `empty` by setting its tophash to zero; it does not zero out the key or value memory immediately. Consequently, iterating over a map and deleting every key (`for k := range m { delete(m, k) }`) will report `len(m) == 0`, but the underlying buckets remain allocated.

To reclaim the memory, the map variable itself must be set to `nil` so that the garbage collector can free the backing store:

```go
m = nil
runtime.GC()
```

This design choice allows safe deletion during iteration, including removing keys that have not yet been visited, without invalidating the iterator.
