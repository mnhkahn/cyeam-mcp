---
title: Go flag Package
type: techniques
created: 2014-07-20
last_updated: 2014-07-20
related: ["[[Go Data Structures]]", "[[Go JSON Parsing]]", "[[Go Interfaces]]"]
sources: ["660d16a9e253"]
---

# Go flag Package

The `flag` package in Go provides command-line argument parsing. Unlike Java, where command-line arguments are passed directly to `main` as strings, Go's `main` function takes no arguments and relies on `flag` for typed parameter handling.

## Defining Flags

Flags are registered before parsing, specifying a name, default value, usage description, and type. The package returns a pointer to the parsed value.

```go
var strFlag = flag.String("s", "", "Description")
var boolFlag = flag.Bool("bool", false, "Description of flag")
```

For non-pointer usage, `StringVar` (and analogous functions) bind the result to an existing variable:

```go
func StringVar(p *string, name string, value string, usage string)
```

## Parsing

After all flags are defined, `flag.Parse()` reads `os.Args[1:]` and populates the registered values.

```go
func main() {
    flag.Parse()
    println(*strFlag, *boolFlag)
}
```

## Usage Conventions

By default, Go flags require the flag name before the value (e.g., `-s 123`). This differs from positional arguments in C or Java, where values are indexed by position. Running `go run testflag.go -s 123` prints `123 false`.

## go_code Repository

The subject created a dedicated GitHub repository, [go_code](https://github.com/mnhkahn/go_code), to collect Go language examples and test code starting in July 2014.
