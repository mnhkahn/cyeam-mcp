---
title: Go Tooling
type: techniques
created: 2016-09-27
last_updated: 2024-10-30
related: ["[[Go Testing]]", "[[Go Performance Optimization]]", "[[Go Concurrency]]", "[[Go Ecosystem]]", "[[Go Strings]]", "[[Go JSON Parsing]]", "[[Go for Loop]]", "[[Go Modules]]"]
sources: ["59c3597a1911", "fb610aef1011", "ef201a9a9a0e", "39b857012501", "c3f6e1834d93", "67ce65dc0b48"]
---

# Go Tooling

In September 2016, the subject compiled a reference of commonly used Go command-line flags and tools.

## Build Flags

### `go build -x`

Prints every command invoked by the build process, including the compiler and linker invocations. Useful for understanding the tool chain or debugging cross-compilation issues.

```bash
$ go build -x
```

### `go build -gcflags`

Passes flags directly to the Go compiler. For example, to disable optimizations and inlining for debugging:

```bash
$ go build -gcflags="-N -l"
```

## Test Flags

### `go test -v`

Enables verbose output, printing the name, status, duration, and logs of each test.

### `go test -race`

Enables the race detector, which reports data races at runtime. It can be used with `go test`, `go run`, and `go build`:

```bash
$ go test -race mypkg
$ go run -race mysrc.go
$ go build -race mycmd
```

### `go test -run`

Filters tests by regular expression. Only tests whose names match the pattern are executed:

```bash
$ go test -run=Example
```

### `go test -coverprofile`

Generates a test-coverage profile and opens it in a browser:

```bash
$ go test -coverprofile=c.out && go tool cover -html=c.out
```

### `go test -exec`

Runs tests through an external program. A common use case is executing tests on an Android device via `adb`:

```bash
$ go test -exec go_android_exec mypkg
```

### `go test -benchmem`

When combined with a benchmark run, reports memory allocations per operation:

```bash
$ go test -bench . -run=_NONE_ -benchmem
```

## Package Management

### `go get -u`

Forces an update to the latest version of a package even if it already exists in `GOPATH`. Library authors are encouraged to document installation with `-u`:

```bash
$ go get -u github.com/golang/lint/golint
```

### `go get -d`

Downloads the package source but skips compilation and installation. This is convenient for cloning repositories into the correct `GOPATH` location, especially for vanity import paths:

```bash
$ go get -d golang.org/x/oauth2/...
```

### `go get -t`

Also downloads dependencies required by test files.

## Listing Packages

### `go list -f`

Formats package metadata using Go templates, useful for scripting:

```bash
$ go list -f '{{.Deps}}' runtime
[runtime/internal/atomic runtime/internal/sys unsafe]
```

## Documentation Conventions

### Deprecation Comments

As of Go 1.8, the standard convention for marking a deprecated API is a comment paragraph beginning with `Deprecated:` followed by guidance on the replacement:

```go
// Deprecated: Drivers should implement ExecerContext instead (or additionally).
type Execer interface {
    Exec(query string, args []Value) (Result, error)
}
```

`godoc` recognizes this format and surfaces the deprecation notice in generated documentation. The subject recommended using exactly `Deprecated:` (not `DEPRECATED` or "This type is deprecated") to remain compatible with future tooling such as `golint`.

## Observability with expvar

In June 2017, the subject documented the standard library `expvar` package, which exposes application-level variables over HTTP at `/debug/vars`. The package provides thread-safe types for `float64`, `int64`, `String`, and `Map` (string keys only). All operations are atomic or mutex-protected, and variables are registered automatically upon creation.

```go
import "expvar"

requests := expvar.NewInt("requests")
requests.Add(1)
```

The `/debug/vars` endpoint returns a JSON object containing every registered variable. The package also exposes `cmdline` and `memstats` by default. Custom types can implement the `Var` interface:

```go
type Var interface {
    String() string // must return valid JSON
}
```

The `expvar.Handler()` function returns an `http.Handler` that can be mounted on a custom router. The subject noted that while the package is convenient for simple counters and strings, the `Var` interface is minimal, and exporting large maps can produce unwieldy output. Additionally, the built-in `memstats` export triggers `runtime.ReadMemStats`, which performs a stop-the-world pause.

## Default GOPATH

In January 2017, the subject translated a blog post by Go team member Jaana Dogan (then rakyll) about the default `GOPATH` introduced in Go 1.8. If the `GOPATH` environment variable is unset, the toolchain now supplies a default:

- Unix-like systems: `$HOME/go`
- Windows: `%USERPROFILE%\\go`

This change lowered the barrier for new Go users, but it did not eliminate the need to add `$GOPATH/bin` to `PATH` for running installed binaries. The default is also suppressed if it would collide with `GOROOT`.

## Dependency Downloads

In June 2018, the subject documented how to download all dependencies for a Go project cloned via `git clone` rather than `go get`. The `go get -d -v ./...` command downloads every package in the current directory and its subdirectories without installing them:

```bash
$ go get -d -v ./...
```

- `-d` downloads source only, skipping installation.
- `-v` enables verbose output, printing each downloaded package.
- `./...` matches all packages under the current directory.

For packages hosted on `golang.org/x/` that are inaccessible in some regions, the subject noted that mirrors such as Golang China or the corresponding GitHub repositories (e.g., `github.com/golang/tools`) can be cloned into `$GOPATH/src/golang.org/x/` manually.

## Documentation with godoc

In September 2018, the subject summarized conventions for producing documentation with `godoc`.

### Running godoc

The `godoc` tool can serve documentation locally:

```bash
$ godoc -http=:6060
```

Navigating to `http://localhost:6060/pkg/<import-path>` displays package documentation. Changes to source comments are reflected without restarting the server.

### Comment Conventions

- Only exported identifiers (capitalized names) receive documentation.
- Package comments should appear immediately before the `package` clause. If longer than a few lines, they are conventionally placed in a `doc.go` file.
- `BUG(who): description` annotations are collected into a "Bugs" section.
- `Deprecated: description` paragraphs mark APIs as deprecated and are recognized by editors such as GoLand.
- URLs in comments are automatically converted to hyperlinks.

### Example Tests

Example code can be written in files named `example_xxx_test.go` using the `xxx_test` package name. Functions named `Example` provide package-level examples, while `ExampleFuncName` provides function-level examples. These appear inline in the generated documentation.

### Comment Formatting

`godoc` uses a lightweight plain-text format rather than Markdown:

- Lines that begin with an uppercase letter and end without punctuation are treated as headings.
- Indented lines (one extra space or a tab) are rendered as code blocks.

The subject also noted the `gocmt` tool for automatically generating skeleton comments for exported identifiers.
