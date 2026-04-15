---
title: Retry Pattern in Go
type: techniques
created: 2018-08-27
last_updated: 2018-08-27
related: ["[[Go Design Patterns]]", "[[Go Concurrency]]", "[[Go Tooling]]"]
sources: ["9b77128105ea"]
---

# Retry Pattern in Go

In August 2018, the subject implemented a small, recursive retry utility for Go functions that may fail transiently.

## Implementation

The retry helper accepts a maximum number of attempts, an initial sleep duration, and a function that returns an error:

```go
func Retry(attempts int, sleep time.Duration, fn func() error) error {
    if err := fn(); err != nil {
        if s, ok := err.(stop); ok {
            return s.error
        }
        if attempts--; attempts > 0 {
            time.Sleep(sleep)
            return Retry(attempts, 2*sleep, fn)
        }
        return err
    }
    return nil
}

type stop struct {
    error
}

func NoRetryError(err error) stop {
    return stop{err}
}
```

## Behavior

- The helper calls `fn` and returns immediately if it succeeds.
- On failure, it waits for `sleep`, then retries with exponential back-off (`sleep` doubles each time).
- If `fn` returns an error wrapped with `NoRetryError`, the retry loop aborts early and the error is returned directly.
- If all attempts are exhausted, the last error is returned.

The subject published the utility in the `mnhkahn/gogogo` repository.
