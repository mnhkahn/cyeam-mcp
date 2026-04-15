---
title: Go Concurrency
type: techniques
created: 2015-07-24
last_updated: 2015-07-24
related: ["[[Go Concurrent Downloads]]", "[[Go Garbage Collection]]", "[[Windows Concurrency]]"]
sources: ["2fe33696a00b"]
---

# Go Concurrency

In July 2015, the subject studied Go's concurrency model, focusing on goroutines, the scheduler, and the role of `GOMAXPROCS`.

## Processes and Threads

An operating-system process is a container for resources such as memory, file handles, and threads. A thread is the unit of execution scheduled by the OS kernel. A process begins with a main thread, which can create additional threads. The OS scheduler distributes threads across available CPU cores according to its own policies.

## Goroutines

A goroutine is a lightweight, independently executing function in Go. Any function can be launched as a goroutine with the `go` keyword. Goroutines start with a small stack (8 KB as of Go 1.4) that grows and shrinks as needed. The Go runtime schedules many goroutines onto a smaller number of OS threads.

By default, the runtime uses a single logical processor, meaning all goroutines are multiplexed onto one OS thread. Even with one thread, goroutines execute concurrently: the runtime switches between them as they block or yield.

## Concurrency vs Parallelism

- **Concurrency** — multiple tasks make progress within the same time period, but not necessarily simultaneously. On a single core, goroutines take turns executing.
- **Parallelism** — multiple tasks execute simultaneously on different CPU cores.

Increasing `GOMAXPROCS` allows the runtime to use more OS threads and therefore enables parallel execution on multi-core hardware. However, more parallelism does not always improve performance; it should be added only after benchmarking confirms a benefit.

## Synchronization Example

The subject documented the use of `sync.WaitGroup` to wait for multiple goroutines to finish:

```go
var wg sync.WaitGroup
wg.Add(2)

go func() {
    defer wg.Done()
    for char := 'a'; char < 'a'+26; char++ {
        fmt.Printf("%c ", char)
    }
}()

go func() {
    defer wg.Done()
    for number := 1; number < 27; number++ {
        fmt.Printf("%d ", number)
    }
}()

wg.Wait()
```

`Add` increments the task counter, `Done` decrements it when a goroutine completes, and `Wait` blocks until the counter reaches zero. Without `Wait`, the main goroutine would exit and terminate the program before the workers finished.

## GOMAXPROCS

`runtime.GOMAXPROCS(n)` sets the number of logical processors available to the Go scheduler. When `n > 1` and the machine has multiple cores, goroutines can run in parallel, producing interleaved output as they compete for shared resources such as standard output.

The subject noted that shared resources must be accessed atomically or protected with synchronization primitives (such as channels or mutexes) to avoid race conditions when running in parallel.
