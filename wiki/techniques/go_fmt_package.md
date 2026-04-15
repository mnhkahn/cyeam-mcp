---
title: Go fmt Package
type: techniques
created: 2018-09-10
last_updated: 2024-11-16
related: ["[[Go Strings]]", "[[Go JSON Parsing]]", "[[Go Tooling]]", "[[Go for Loop]]", "[[Go Reflection]]"]
sources: ["2737e335c623", "68ba69e31b09"]
---

# Go fmt Package

In September 2018, the subject analyzed the internals of Go's `fmt` package, focusing on how format strings are parsed and how values are formatted.

## Struct Debugging with `%+v`

In March 2017, the subject documented a common debugging mistake: printing a struct with `%v` omits field names, making complex values hard to read. Using `%+v` instead prints each field name alongside its value, which is often sufficient for inspection without manually serializing to JSON:

```go
fmt.Printf("%+v\n", a) // &{A:Hello}
```

The `fmt` package implements this by iterating over struct fields with reflection and writing `Name:` before each value when the `+` flag is present.

## Format String Structure

A format verb begins with `%` and consists of up to four parts:

1. **Flags** — e.g., `+`, `-`, `#`, `0`, ` ` (space).
2. **Width** — minimum field width; content longer than the width is never truncated.
3. **Precision** — e.g., `%.2f` controls decimal places for floats.
4. **Verb** — the type-specific conversion character (e.g., `v`, `d`, `s`, `p`, `T`).

## fmt.State and fmt.Formatter

`fmt.State` is an interface that exposes the parsed width, precision, and flags, and provides a `Write` method for output:

```go
type State interface {
    Write(b []byte) (n int, err error)
    Width() (wid int, ok bool)
    Precision() (prec int, ok bool)
    Flag(c int) bool
}
```

Types can implement `fmt.Formatter` to take full control of their formatting:

```go
type Formatter interface {
    Format(f State, c rune)
}
```

When a value implements `Formatter`, the `fmt` package delegates to it for all verbs except `%T` and `%p`, which are always handled by reflection.

## Type-Specific Formatting

The `printArg` function dispatches on the concrete type of the argument to avoid reflection for built-in types:

- `bool` → `fmtBool`
- integers → `fmtInteger` (supports bases 2, 8, 10, 16)
- floats → `fmtFloat`
- strings → `fmtString`

For structs with `%v`, the package iterates over fields using reflection. `%+v` includes field names, and `%#v` includes the type name.

## fmt.Stringer

If a type does not implement `Formatter` but does implement `fmt.Stringer`, `fmt` calls its `String` method for verbs such as `%s` and `%v`:

```go
type Stringer interface {
    String() string
}
```

If `String()` panics, `fmt` recovers and prints a placeholder such as `%!s(PANIC=...)` instead of crashing the program.

## Performance Note

Because `fmt` parses the format string and may use reflection for user-defined types without `Formatter` or `Stringer`, it is slower than direct `strconv` calls for simple conversions. Implementing `Formatter` for frequently formatted complex types can reduce overhead.
