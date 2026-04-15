---
title: Base64 Encoding
type: techniques
created: 2015-01-20
last_updated: 2015-01-20
related: ["[[URL Shortening]]", "[[Go Binary Encoding]]"]
sources: ["f3604ee716ed"]
---

# Base64 Encoding

Base64 is a binary-to-text encoding scheme that represents binary data using a 64-character alphabet. In January 2015, the subject encountered a variant optimized for use in URLs and databases.

## Standard Alphabet

The standard Base64 alphabet consists of:

```
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/
```

This yields 64 symbols, with `+` and `/` filling the final two positions. The output is padded with `=` characters so that the total length is a multiple of four.

## URL-Safe Variant

Standard Base64 is not ideal for URLs because `+` and `/` have special meanings in URL encoding and `=` is sometimes treated as a query-parameter separator. The URL-safe variant (RFC 4648 section 5) makes three adjustments:

- Replaces `+` with `-`.
- Replaces `/` with `_`.
- Omits padding `=` characters.

Go's `encoding/base64` package defines this variant as:

```go
const encodeURL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
```

Using the URL-safe alphabet avoids percent-encoding overhead and simplifies storage in systems where `%` or `=` are reserved characters.
