---
title: Go Performance Optimization
type: techniques
created: 2016-08-18
last_updated: 2024-11-16
related: ["[[Go Testing]]", "[[Go Tooling]]", "[[Go Garbage Collection]]", "[[Go Concurrency]]", "[[Go Data Structures]]"]
sources: ["30ba664dc7d7", "e36144b5e931"]
---

# Go Performance Optimization

In August 2016, the subject translated and summarized a SignalFx engineering article on optimizing Go services. The core methodology combines CPU profiling, heap profiling, escape analysis, and benchmarking to identify and eliminate unnecessary heap allocations.

## Enabling pprof

Go's `net/http/pprof` package exposes runtime profiles over HTTP. Adding a single blank import enables the default handlers:

```go
import _ "net/http/pprof"
```

For finer-grained control, individual handlers can be mounted explicitly:

```go
handler.PathPrefix("/debug/pprof/profile").HandlerFunc(pprof.Profile)
handler.PathPrefix("/debug/pprof/heap").HandlerFunc(pprof.Heap)
```

## CPU Profiling

A 30-second CPU profile is collected with `curl` and analyzed with `go tool pprof`:

```bash
curl http://ingest58:6060/debug/pprof/profile > /tmp/ingest.profile
go tool pprof ingest /tmp/ingest.profile
(pprof) top7
```

High CPU usage in `runtime.mallocgc`, `runtime.scanobject`, or `runtime.mSpan_Sweep` indicates that garbage collection is consuming significant CPU time. Rather than tuning the GC directly, the recommended response is to reduce heap allocations in application code.

## Heap Profiling

Heap profiles reveal which functions allocate the most objects:

```bash
curl http://ingest58:6060/debug/pprof/heap > /tmp/heap.profile
go tool pprof -alloc_objects /tmp/ingest /tmp/heap.profile
(pprof) top3
```

## Escape Analysis

The compiler can print escape decisions with `-gcflags='-m'`:

```bash
go build -gcflags='-m' . 2>&1 | grep partitioner.go
```

If the compiler cannot prove that a variable's lifetime is bounded to the current stack frame, it allocates the variable on the heap. In the translated example, passing integers to a debug-logging function caused several local variables to escape to the heap, resulting in four allocations per call.

## Benchmarking

Before optimizing, write a benchmark to establish a baseline:

```go
func BenchmarkPartition(b *testing.B) {
    r := rand.New(rand.NewSource(0))
    msg := sarama.ProducerMessage{Key: &partitionPickingKey{}}
    p := Partitioner{ringSize: 1024}
    numPartitions := int32(1024)
    for i := 0; i < b.N; i++ {
        msg.Key.(*partitionPickingKey).tsid = r.Int63()
        part, err := p.Partition(&msg, numPartitions)
        if err != nil || part < 0 || part >= numPartitions {
            panic("benchmark failure")
        }
    }
}
```

Run with memory allocation tracking:

```bash
go test -v -bench . -run=_NONE_ -benchmem
```

In the example, the initial benchmark reported `202 ns/op` with `4 allocs/op`. After removing the debug-logging calls that caused heap escapes, the benchmark improved to `40.5 ns/op` with `0 allocs/op`. The subject emphasized saving benchmark results over time so that performance regressions can be detected after each commit.

## Temporary Object Pools

In February 2017, the subject addressed a production latency spike caused by frequent slice allocations on the heap. Under high concurrency, repeatedly calling `make([]int64, 0, len)` led to memory fragmentation and periodic TPS drops from 2000 to 200.

### `sync.Pool`

The standard library's `sync.Pool` can cache allocated objects between garbage-collection cycles. The subject's first attempt stored slices in a single pool:

```go
var idsPool = sync.Pool{
    New: func() interface{} {
        ids := make([]int64, 0, 20000)
        return &ids
    },
}
```

This reduced allocations but wasted memory when only small slices were needed, because every returned slice had a 20 000-element capacity.

### Slab-Style Classed Pool

To handle variable-length slices more efficiently, the subject implemented a classed pool that maintains multiple `sync.Pool` instances, each sized to a power-of-two tier (e.g., 5, 10, 20, 40, ... up to 30 000). When a slice is requested, the allocator rounds up to the smallest class that fits and draws from that pool. When the slice is freed, it is returned to the matching class:

```go
type SyncPool struct {
    classes     []sync.Pool
    classesSize []int
    minSize     int
    maxSize     int
}

func (pool *SyncPool) Alloc(size int) []int64 {
    if size <= pool.maxSize {
        for i := 0; i < len(pool.classesSize); i++ {
            if pool.classesSize[i] >= size {
                mem := pool.classes[i].Get().(*[]int64)
                return (*mem)[:0]
            }
        }
    }
    return make([]int64, 0, size)
}
```

After deploying the slab allocator, the service reported at least a 30% TPS improvement and a lower TP99 latency.
