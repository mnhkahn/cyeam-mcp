---
title: Circuit Breaker in Go
type: techniques
created: 2020-03-01
last_updated: 2020-03-01
related: ["[[Go Design Patterns]]", "[[Retry Pattern in Go]]", "[[Go Concurrency]]", "[[Go Performance Optimization]]"]
sources: ["015cc2547d37"]
---

# Circuit Breaker in Go

In March 2020, the subject studied and documented the circuit breaker pattern as implemented in the Go library `github.com/rubyist/circuitbreaker`.

## States

A circuit breaker cycles through three states:

- **CLOSED** — requests flow normally to the downstream service.
- **OPEN** — after failures exceed a threshold, requests are blocked immediately.
- **HALFOPEN** — after a cooling timeout, a limited number of probe requests are allowed to test whether the downstream service has recovered.

## Request Admission

- **CLOSED**: all requests are allowed.
- **OPEN**: requests are rejected until `CoolingTimeout` elapses, then the breaker transitions to HALFOPEN.
- **HALFOPEN**: requests are allowed only within a `DetectTimeout` window.

State transitions are performed with atomic operations:

```go
atomic.StoreInt32((*int32)(&b.state), int32(HALFOPEN))
```

## Tripping Strategies

The library accepts a `TripFunc` that decides when to open the circuit:

- `ThresholdTripFunc` — open after a raw failure count exceeds a limit.
- `ConsecutiveTripFunc` — open after a streak of consecutive failures.
- `RateTripFunc` — open when the error rate exceeds a threshold, subject to a minimum sample size.

## Metrics

The `Metricser` interface tracks successes, failures, timeouts, consecutive errors, and overall error rate. The default implementation uses a ring buffer of time buckets (`window`). Each bucket covers a fixed `bucketTime` interval, and the total window length is `bucketTime * bucketNums`. When a bucket expires, its counters are atomically subtracted from the aggregate totals and the bucket is reset.

## Limitations

The subject noted two limitations in the studied implementation:

1. All circuit breakers share the same `BucketTime`; the sampling window cannot be customized per breaker.
2. The cooling timeout is fixed and cannot be updated dynamically.
