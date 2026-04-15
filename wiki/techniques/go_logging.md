---
title: Go Logging
type: techniques
created: 2017-07-14
last_updated: 2017-07-14
related: ["[[Go Ecosystem]]", "[[Go Tooling]]", "[[Go Performance Optimization]]"]
sources: ["437e69796aaf"]
---

# Go Logging

In July 2017, the subject built a custom leveled logging package in Go to address gaps in the standard `log` package. The implementation covers log levels, automatic file rotation, asynchronous output, and correct source-file line numbers.

## Log Levels

The logger supports four levels, ordered from most to least severe:

```go
const (
    LevelError = iota
    LevelWarning
    LevelInformational
    LevelDebug
)
```

Each level is backed by its own `log.Logger` instance with a distinct prefix (`[E]`, `[W]`, `[I]`, `[D]`). Because all four loggers share the same `io.Writer`, output is serialized to a single destination while keeping the prefix logic simple:

```go
type Logger struct {
    level int
    err   *log.Logger
    warn  *log.Logger
    info  *log.Logger
    debug *log.Logger
}

logger.err = log.New(w, "[E] ", flag)
logger.warn = log.New(w, "[W] ", flag)
// ...
```

Messages below the configured level are discarded before formatting.

## File Rotation

Rotation is implemented by swapping the underlying `io.Writer`. The subject recommended `gopkg.in/natefinch/lumberjack.v2`, which implements `io.Writer` and rotates files when they exceed a maximum size:

```go
jack := &lumberjack.Logger{
    Filename: "app.log",
    MaxSize:  100, // megabytes
}
logger := NewLogger(jack)
```

## Asynchronous Output

To avoid blocking the caller on I/O, log calls are dispatched to a worker pool via a job queue. The subject used `github.com/ivpusic/grpool` for goroutine pooling:

```go
ll.p.JobQueue <- func() {
    ll.err.Output(ll.depth, fmt.Sprintf(format, v...))
}
```

## Correct Call Depth

Because the logger wraps the standard `log` package, the call stack is deeper than the original call site. The standard `log.Logger.Output` method accepts a `calldepth` parameter to adjust the frame used for source-file line numbers. For a single wrapper layer, a depth of 3 produces the correct line number.

## Thread Safety

The standard `log` package serializes output with an internal mutex, so the underlying write is thread-safe. The wrapper adds level filtering and asynchronous dispatch on top of this guarantee.

## Design Philosophy

The subject emphasized composing functionality through interfaces rather than adding framework-specific configuration options. For example, instead of building email or Elasticsearch support directly into the logger, the recommended approach is to implement a custom `io.Writer` (such as `ESWriter`) and inject it. This keeps the logger focused on formatting and dispatch while leveraging Go's interface-oriented design.
