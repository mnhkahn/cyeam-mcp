---
title: Go Strings
type: techniques
created: 2014-08-12
last_updated: 2018-08-16
related: ["[[Go Unicode Handling]]", "[[Go Slices]]", "[[Go for Loop]]", "[[beego]]", "[[Redis Data Structures]]", "[[Go JSON Parsing]]", "[[Go Tooling]]"]
sources: ["5ff8e7eed4c7", "5662f6e4295c", "9b545a789aa0", "67bcd140fbea", "b2bc6dbdf874", "ed4ecc05693c", "1015d493c7fa"]
---

# Go Strings

Go strings are immutable sequences of bytes. Because strings are read-only, indexing yields a byte but does not permit assignment. Operations that modify strings must produce new strings, typically by converting to `[]rune` when Unicode safety is required.

## Case Conversion

ASCII case conversion relies on the fixed offset between uppercase and lowercase letters (32 code points). Go's `strings.ToUpper` delegates to the `unicode` package, which handles ASCII directly and leaves non-ASCII runes unchanged.

```go
const MaxASCII = '\u007F'

func toUpper(r rune) rune {
    if r <= MaxASCII {
        if 'a' <= r && r <= 'z' {
            r -= 'a' - 'A'
        }
        return r
    }
    return r
}
```

Because modern encodings (Unicode, GBK, etc.) preserve ASCII compatibility, this optimization is safe for English letters.

## String Reversal

Reversing a string in Go is concise using rune slices and multiple assignment:

```go
func Reverse(s string) string {
    r := []rune(s)
    for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {
        r[i], r[j] = r[j], r[i]
    }
    return string(r)
}
```

Using `[]rune` rather than `[]byte` ensures that multi-byte UTF-8 characters remain intact after reversal.

## Split Behavior

In November 2014, the subject discovered a subtle behavior of `strings.Split`: splitting an empty string returns a slice of length 1 containing the empty string, not an empty slice.

```go
a := strings.Split("", ";")
// len(a) == 1, a[0] == ""
```

This behavior caused a bug when upgrading beego to version 1.4.2. The `beego.AppConfig.Strings` method checks `len(v) == 0` to decide whether to fall back to a default configuration section, but because `strings.Split` on an empty value always returns a length of 1, the fallback logic was never executed. The fix was to check the first element (`v[0] == ""`) instead.

## Trimming Functions

In August 2015, the subject clarified the difference between `strings.TrimRight` and `strings.TrimSuffix`. `TrimRight` treats the second argument as a *cutset*: it removes trailing characters from the string that match *any* character in the cutset, not the cutset as a literal suffix.

```go
strings.TrimRight("cyeamblog.go", ".go")
// Result: "cyeambl" (removes '.', 'g', and 'o' from the end)
```

By contrast, `strings.TrimSuffix` removes only the exact trailing substring:

```go
strings.TrimSuffix("cyeamblog.go", ".go")
// Result: "cyeamblog"
```

Additional examples:

```go
strings.TrimRight("abba", "ba")        // ""
strings.TrimRight("abcdaaaaa", "abcd") // ""
strings.TrimSuffix("abcddcba", "dcba") // "abcd"
```

## Internal Representation

Go strings are implemented as a lightweight struct containing a pointer to the byte array and a length field. Prior to Go 1.5, the runtime was written in C; as of Go 1.5 the runtime is self-hosted in Go. The string header can be conceptualized as:

```go
struct String {
    byte* str
    intgo len
}
```

Because the length is stored explicitly, `len(s)` operates in `O(1)` time. The absence of a null terminator means strings can contain arbitrary byte sequences, including embedded zero bytes. Immutability ensures that string assignment is merely a pointer and length copy, but any modification requires allocating a new byte array.

## Integer-to-String Conversion

In June 2018, the subject benchmarked three ways to convert an integer to a string in Go: `fmt.Sprintf`, `strconv.Itoa`, and `strconv.FormatInt`.

- `fmt.Sprintf("%d", a)` is the most flexible but slowest, because it parses a format string and, for `int`, dispatches through `fmtInteger` one digit at a time for base 10.
- `strconv.Itoa(a)` is a thin wrapper around `strconv.FormatInt(int64(a), 10)`.
- `strconv.FormatInt(i, base)` is the fastest for base 10. It optimizes small non-negative integers (`0 <= i < 100`) with a pre-computed lookup table (`smallsString`), and for larger values it processes two digits at a time rather than one.

For power-of-two bases (2, 4, 8, 16, 32), `FormatInt` replaces division and modulo with bit shifts and masks, further improving performance.

Benchmark results (Go 1.10.1) showed that `FormatInt` and `Itoa` are roughly an order of magnitude faster than `Sprintf` for small numbers and allocate fewer bytes per operation.

## strings.Builder

Go 1.10 introduced `strings.Builder`, a purpose-built type for efficiently concatenating strings. Unlike `bytes.Buffer`, `strings.Builder` is write-only and implements only `io.Writer`. Its `String()` method avoids an extra copy by reinterpreting the underlying `[]byte` as a `string` via an unsafe pointer cast:

```go
func (b *Builder) String() string {
    return *(*string)(unsafe.Pointer(&b.buf))
}
```

The type contains a `copyCheck` mechanism: an `addr` field stores the receiver's address on first use and panics if the builder is later copied by value after it has been written to. `strings.Builder` is not safe for concurrent use without external synchronization.

Growth follows the formula `2*cap(b.buf) + n`, which differs from the standard slice doubling behavior by adding the requested growth amount to the doubled capacity.
