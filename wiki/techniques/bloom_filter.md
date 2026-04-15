---
title: Bloom Filter
type: techniques
created: 2014-07-30
last_updated: 2014-07-30
related: ["[[Hash Functions]]", "[[Go Binary Encoding]]", "[[Go Data Structures]]"]
sources: ["918580003eb4"]
---

# Bloom Filter

A Bloom filter is a space-efficient probabilistic data structure used to test whether an element is a member of a set. False positives are possible, but false negatives are not.

## Motivation

Exact membership tests on large unsorted datasets are expensive: linear search is $O(n)$ and binary search is $O(\log n)$. Hashing reduces lookup time to $O(1)$, but storing every element explicitly still consumes significant memory.

## Structure

A Bloom filter uses a bit array of length $m$ and $k$ independent hash functions. To insert an element, all $k$ hash values are computed and the corresponding bits are set to 1. To query an element, the same $k$ bits are checked; if any bit is 0, the element is definitely not in the set. If all bits are 1, the element is probably in the set.

For a blacklist of 100 million entries, a 1-bit-per-entry array occupies roughly 1 GB—small enough to keep in memory.

## Collision Reduction

Because hash collisions are unavoidable, a single hash function can produce false positives. Using multiple independent hash functions reduces the error rate exponentially. If one hash function has a 10% collision probability, three independent hashes lower the effective collision rate to roughly $0.1 \times 0.1 \times 0.1 = 0.1\%$ (under independence assumptions). All $k$ results are stored in the same bit array, and a query requires all $k$ positions to be set before reporting membership.

## Trade-offs

- **Space**: far smaller than storing the full set.
- **Time**: $O(k)$ per operation, independent of set size.
- **Accuracy**: tunable via $m$ and $k$; deletion is not supported without extensions such as counting Bloom filters.
