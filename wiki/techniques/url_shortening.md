---
title: URL Shortening
type: techniques
created: 2014-07-24
last_updated: 2014-07-25
related: ["[[Web Architecture Concepts]]", "[[Go Data Structures]]"]
sources: ["154e147254c0", "9c83f962eb16"]
---

# URL Shortening

URL shortening maps a long URL to a compact code that redirects to the original address. Services such as Google's goo.gl and Sina's t.cn popularized the technique, which trades storage for convenience.

## Design Approaches

Two broad strategies exist:

1. **Database-backed mapping**: Generate a short code, store the code-to-URL relationship in a database, and resolve lookups against that store.
2. **Algorithmic compression**: Compress the original URL itself without external storage.

The subject evaluated gzip and AES for algorithmic compression but found that compressed output was often longer than the original URL, making database-backed mapping the practical choice.

## Short Code Design

### Base-62 Encoding

HTTP URLs safely include the digits `0–9`, lowercase `a–z`, and uppercase `A–Z`, yielding an alphabet of 62 characters. Encoding an integer ID in base 62 produces the shortest possible alphanumeric code. A 5-digit base-62 code can represent roughly 916 million values ($62^5$), which the subject considered sufficient for most use cases.

### Scattering Sequential IDs

Sequential integer IDs produce predictable short codes (e.g., `00001`, `00002`). To obscure the sequence while preserving uniqueness, the subject adopted a bit-reversal scatter within fixed blocks. For a block size of 8, the lower 8 bits of an ID are reversed; higher bits pass through unchanged. After scattering, the value is base-62 encoded.

Example Go implementation (adapted from a Python reference):

```go
type UrlEncoder struct {
    BlockSize uint
    Mask      uint64
    Mapping   []uint
}

func NewUrlEncoder(blocksize uint) *UrlEncoder {
    u := &UrlEncoder{BlockSize: blocksize}
    u.Mask = (1 << blocksize) - 1
    for i := uint(0); i < blocksize; i++ {
        u.Mapping = append(u.Mapping, blocksize-i-1)
    }
    return u
}

func (u *UrlEncoder) Encode(n uint64) uint64 {
    return (n & ^u.Mask) | u.encode(n&u.Mask)
}

func (u *UrlEncoder) encode(n uint64) uint64 {
    var result uint64
    for i, b := range u.Mapping {
        if n&(1<<uint(i)) > 0 {
            result |= (1 << b)
        }
    }
    return result
}
```

## Storage Considerations

Although Redis offers fast in-memory lookups, the subject noted that MySQL supports bidirectional queries more naturally: resolving a short code to a URL (ID lookup) and checking whether a URL already exists (URL lookup). For a schema as simple as `(id, url)`, a relational database was chosen to satisfy both access patterns.
