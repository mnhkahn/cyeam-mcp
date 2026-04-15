---
title: Go Binary Encoding
type: techniques
created: 2014-07-29
last_updated: 2014-07-29
related: ["[[Hash Functions]]", "[[Go Data Structures]]"]
sources: ["e7c5b9476f0b"]
---

# Go Binary Encoding

The `encoding/binary` package in Go converts between byte sequences and fixed-size numeric values, handling both big-endian and little-endian byte order.

## Byte Order

- **Big-endian**: the lowest memory address holds the most significant byte.
- **Little-endian**: the lowest memory address holds the least significant byte.

## Converting a Byte Slice to uint32

```go
package main

import (
    "fmt"
    "encoding/binary"
)

func main() {
    a := []byte{0, 1, 2, 3}
    fmt.Println(a)
    fmt.Println(binary.BigEndian.Uint32(a))
    fmt.Println(binary.LittleEndian.Uint32(a))
}
```

Output:

```
[0 1 2 3]
66051
50462976
```

For big-endian, the bytes are assembled as `0<<24 | 1<<16 | 2<<8 | 3`, yielding 66051. For little-endian, the order is reversed, yielding 50462976.

## ByteOrder Interface

Both `BigEndian` and `LittleEndian` implement the `ByteOrder` interface:

```go
type ByteOrder interface {
    Uint16([]byte) uint16
    Uint32([]byte) uint32
    Uint64([]byte) uint64
    PutUint16([]byte, uint16)
    PutUint32([]byte, uint32)
    PutUint64([]byte, uint64)
    String() string
}
```

The package does not validate slice lengths; passing fewer bytes than the type width causes a runtime panic (`index out of range`).
