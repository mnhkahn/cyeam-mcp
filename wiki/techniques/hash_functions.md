---
title: Hash Functions
type: techniques
created: 2014-07-28
last_updated: 2018-05-28
related: ["[[Go Data Structures]]", "[[URL Shortening]]", "[[Redis Data Structures]]", "[[String Search Algorithms]]"]
sources: ["a9da59a6bb51", "36793cef67f5"]
---

# Hash Functions

A hash function maps input data of arbitrary size to a fixed-size value. In Go, all hash functions implement the `hash.Hash` interface defined in the standard library.

## Go hash.Hash Interface

```go
type Hash interface {
    io.Writer
    Sum(b []byte) []byte
    Reset()
    Size() int
    BlockSize() int
}
```

The interface embeds `io.Writer`, so data is fed via `Write`. The resulting hash is retrieved with `Sum`. When `Sum(nil)` is called, the hash is returned directly; otherwise it is appended to the supplied slice.

## MD5

MD5 is a cryptographic hash function that produces a 128-bit (16-byte) digest, typically rendered as 32 hexadecimal characters.

```go
package main

import (
    "crypto/md5"
    "encoding/hex"
)

func main() {
    m := md5.New()
    m.Write([]byte("hello, world"))
    s := hex.EncodeToString(m.Sum(nil))
    println(s)
}
```

Because each byte spans 0–255 (two hex digits), the byte slice returned by `Sum` has length 16.

## FNV

Fowler–Noll–Vo (FNV) is a family of non-cryptographic hash algorithms. Go's `hash/fnv` package provides 32-bit and 64-bit variants (FNV-1 and FNV-1a). It is suitable for hash tables and checksums where speed matters more than cryptographic security.

```go
package main

import (
    "fmt"
    "hash/fnv"
    "encoding/hex"
)

func main() {
    a := fnv.New32()
    a.Write([]byte("hello"))
    fmt.Println(hex.EncodeToString(a.Sum(nil)))
}
```

FNV is available in widths of 32, 64, 128, 256, 512, and 1024 bits, with relatively low collision rates for general-purpose hashing.

## Other Algorithms and Their Uses

In May 2018, the subject surveyed additional hash algorithms commonly used in databases and distributed systems.

### DJB

The DJB hash initializes to 5381 and iterates over the input with `hash * 33 + c`. In Redis, a case-insensitive variant is used for dictionary keys:

```c
unsigned int dictGenCaseHashFunction(const unsigned char *buf, int len) {
    unsigned int hash = 5381;
    while (len--)
        hash = ((hash << 5) + hash) + (tolower(*buf++));
    return hash;
}
```

### Java String Hash

Java's `String.hashCode()` uses a similar polynomial rolling hash with multiplier 31 instead of 33, and caches the result in the string object.

### FNV in String Search

Go's string-search implementation (Rabin-Karp) uses an FNV-like rolling hash with prime 16,777,619. The rolling property allows updating the hash in `O(1)` time when the window slides by one character.

### Thomas Wang's 32-bit Mix

Redis applies this mix function when hashing integer keys:

```c
int hash32shift(int key) {
    key = ~key + (key << 15);
    key = key ^ (key >> 12);
    key = key + (key << 2);
    key = key ^ (key >> 4);
    key = key * 2057;
    key = key ^ (key >> 16);
    return key;
}
```

### MurmurHash

MurmurHash is widely used in distributed systems for consistent hashing and partitioning. It offers low collision rates and high throughput. A Go implementation is available at `github.com/huichen/murmur`.

### CRC32

CRC32 produces collision rates comparable to MurmurHash and can be accelerated by CPU instructions (PCLMULQDQ and SSE4.1). Codis uses CRC32 for slot assignment:

```go
slotId = crc32(key) % 1024
```

Go's `hash/crc32` package automatically selects a hardware-accelerated implementation when available.

### memhash

Go's built-in `map` uses `memhash`, located in the runtime. It is inspired by xxHash and CityHash, and falls back to an AES-based hash when hardware support is present. The subject benchmarked `memhash` at roughly 475 ns/op with zero allocations, significantly faster than pure-Go implementations of DJB, FNV, or MurmurHash.
