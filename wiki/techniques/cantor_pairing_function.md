---
title: Cantor Pairing Function
type: techniques
created: 2026-03-18
last_updated: 2026-04-15
related: ["[[Go Data Structures]]", "[[Go Performance Optimization]]", "[[Hash Functions]]"]
sources: ["70ea69c7afa8"]
---

# Cantor Pairing Function

In March 2026, the subject explored the Cantor pairing function as a way to encode two natural numbers into a single natural number, avoiding the overhead of string concatenation (`fmt.Sprintf("%d_%d", id1, id2)`) for composite keys.

## Properties

- Works only on natural numbers (non-negative integers).
- Supports bijective encoding and decoding.
- `f(k1, k2)` and `f(k2, k1)` produce different results; sorting the inputs first can yield a commutative variant if desired.
- The result can be much larger than either input, so overflow must be considered.

## Implementation

```go
func Encode(k1, k2 uint64) uint64 {
    pair := k1 + k2
    pair = pair * (pair + 1)
    pair = pair / 2
    pair = pair + k2
    return pair
}

func Decode(pair uint64) (uint64, uint64) {
    w := math.Floor((math.Sqrt(float64(8*pair+1)) - 1) / 2)
    t := (w*w + w) / 2
    k2 := pair - uint64(t)
    k1 := uint64(w) - k2
    return k1, k2
}
```

## Bit-Packing Alternative

For fixed-size inputs, a simpler bit-packing scheme can be used:

```go
func EncodeBit(k1, k2 uint32) uint64 {
    return uint64(k1)<<32 | uint64(k2)
}

func DecodeBit(pair uint64) (uint32, uint32) {
    k1 := uint32(pair >> 32)
    k2 := uint32(pair) & 0xFFFFFFFF
    return k1, k2
}
```

Benchmarks showed that both Cantor pair and bit-packing encode in ~0.37 ns/op with zero allocations, while string formatting took ~271 ns/op with three allocations. The subject concluded that if the input range fits in 32 bits, bit-packing is preferable because it is simpler and avoids overflow concerns.
