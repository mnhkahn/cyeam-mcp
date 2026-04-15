---
title: Go BitSet
type: techniques
created: 2026-03-18
last_updated: 2026-04-15
related: ["[[Go Data Structures]]", "[[Bitwise Operations]]", "[[Bloom Filter]]", "[[Go Performance Optimization]]"]
sources: ["642807fd179d"]
---

# Go BitSet

In March 2026, the subject documented the use of bitset (also called bitmap) as a memory-efficient set structure for non-negative integers. The `github.com/willf/bitset` package stores each integer as a single bit inside a `[]uint64` slice, which dramatically reduces memory compared to a `map[int]bool`.

## Example

```go
var b bitset.BitSet
b.Set(10).Set(11)
if b.Test(1000) {
    b.Clear(1000)
}
for i, e := b.NextSet(0); e; i, e = b.NextSet(i + 1) {
    fmt.Println("Bit is set:", i)
}
```

## Internal Representation

- An empty bitset starts with an empty slice.
- Setting bit `0` produces `[1]` (`0x00000001`).
- Setting bit `10` produces `[1025]` (`0x00000401`).
- Setting bit `64` expands the slice to `[1025, 1]` because a second `uint64` is needed.

Within each `uint64`, the least-significant bit represents the smallest number.

## Alternatives

For very large sparse integers, the subject noted that `roaring` bitmaps (`github.com/RoaringBitmap/roaring`) can compress the lower-bit wastage better than a plain bitset. Benchmarks on a small set showed:

| Approach | Latency | Allocations |
|---|---|---|
| `map[int]int8` | ~28 ns/op | 0 B/op |
| `bitset.BitSet` | ~1.9 ns/op | 0 B/op |
| `roaring.Bitmap` | ~492 ns/op | 152 B/op |

For dense non-negative integer sets, the subject recommends bitset as the default choice.
