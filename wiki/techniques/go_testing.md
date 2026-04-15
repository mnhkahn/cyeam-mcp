---
title: Go Testing
type: techniques
created: 2014-09-25
last_updated: 2014-09-25
related: ["[[Sorting Algorithms]]", "[[Go Data Structures]]"]
sources: ["fa7a9d8ad637"]
---

# Go Testing

The `testing` package in Go provides two primary modes of verification: unit tests (用例测试) and benchmarks (压力测试).

## Unit Tests

Unit tests are defined in files ending with `_test.go` within the same package as the code under test. Test functions must:

- Be named `TestXxx`, where `Xxx` does not start with a lowercase letter.
- Accept a single parameter of type `*testing.T`.
- Use `t.Error`, `t.Errorf`, `t.FailNow`, `t.Fatal`, or `t.FatalIf` to mark failure.
- Use `t.Log` to record diagnostic output.

Tests run in source order when `go test` is invoked.

### Example

```go
func TestHeapSort(t *testing.T) {
    test0 := []int{49, 38, 65, 97, 76, 13, 27, 49}
    test1 := []int{13, 27, 38, 49, 49, 65, 76, 97}
    heapSort(BySortIndex(test0), 0, len(test0))
    for i := 0; i < len(test0); i++ {
        if test0[i] != test1[i] {
            t.Fatal("error")
        }
    }
}
```

Run with:

```bash
go test -v
```

## Benchmarks

Benchmark functions are named `BenchmarkXxx` and accept `*testing.B`. The benchmark runner executes the function loop `b.N` times, measuring time per operation.

```go
func BenchmarkHeapSort(b *testing.B) {
    b.StopTimer()
    b.StartTimer()
    b.N = 1234
    for i := 0; i < b.N; i++ {
        test0 := []int{49, 38, 65, 97, 76, 13, 27, 49}
        test1 := []int{13, 27, 38, 49, 49, 65, 76, 97}
        heapSort(BySortIndex(test0), 0, len(test0))
        for i := 0; i < len(test0); i++ {
            if test0[i] != test1[i] {
                b.Fatal("error")
            }
        }
    }
}
```

Run with:

```bash
go test -v -test.bench=".*"
```

Sample output:

```
BenchmarkHeapSort           1234              1620 ns/op
```

## Subject's Reflection

The subject noted the adage that experienced developers write tests before implementation and resolved to adopt the practice in future Go projects.
