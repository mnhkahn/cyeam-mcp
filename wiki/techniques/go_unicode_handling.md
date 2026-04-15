---
title: Go Unicode Handling
type: techniques
created: 2014-08-04
last_updated: 2014-08-04
related: ["[[Go JSON Parsing]]", "[[Go Binary Encoding]]"]
sources: ["68174d19ac76"]
---

# Go Unicode Handling

Go represents Unicode characters with the `rune` type, an alias for `int32`. While `byte` (alias for `uint8`) suffices for ASCII, `rune` is required for correct iteration over UTF-8 strings containing non-ASCII characters.

## Converting Strings to Runes

A string can be converted to a slice of runes with `[]rune(str)`, allowing per-character access regardless of byte width.

## Manual Unicode Encoding

To encode a string into JSON-style `\uXXXX` escapes:

```go
rs := []rune("golang中文unicode编码")
j := ""
for _, r := range rs {
    rint := int(r)
    if rint < 128 {
        j += string(r)
    } else {
        j += "\\u" + strconv.FormatInt(int64(rint), 16)
    }
}
```

English characters retain their original encoding; Chinese characters are converted to four-digit hexadecimal values prefixed with `\u`.

## Custom json.Marshaler

Rather than manual encoding, the subject implemented the `json.Marshaler` interface. `json.Marshal` recursively traverses a value and calls `MarshalJSON` on any non-nil type that implements the interface.

```go
type QuoteString struct {
    QString string
}

func (q QuoteString) MarshalJSON() ([]byte, error) {
    return []byte(strconv.QuoteToASCII(q.QString)), nil
}

type ColorGroup struct {
    ID     int         `json:"id,string"`
    Name   QuoteString `json:"name"`
    Colors []string
}
```

`strconv.QuoteToASCII` produces an ASCII-quoted string with non-ASCII characters escaped as `\uXXXX`, eliminating the need for hand-rolled encoding logic.
