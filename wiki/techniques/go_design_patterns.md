---
title: Go Design Patterns
type: techniques
created: 2015-08-12
last_updated: 2015-08-12
related: ["[[Go Concurrency]]", "[[Go Interfaces]]", "[[Go Data Structures]]"]
sources: ["fd1e34325af0"]
---

# Go Design Patterns

## Singleton Pattern

The singleton pattern restricts a type to a single instance. In August 2015, the subject documented several Go implementations, ranging from a simple unchecked version to a thread-safe variant using double-checked locking and the idiomatic `sync.Once` approach.

### Unchecked Singleton

A basic implementation stores the instance in a package-level variable and returns it on demand:

```go
var _self *Singleton

type Singleton struct {
    Name string
}

func Instance() *Singleton {
    if _self == nil {
        _self = new(Singleton)
    }
    return _self
}
```

This version is unsafe under concurrency because multiple goroutines can observe `_self == nil` simultaneously and create multiple instances.

### Double-Checked Locking

To make the singleton thread-safe without penalizing every access, the subject applied double-checked locking. The outer check avoids locking once the instance exists, while the inner check prevents duplicate creation after the lock is acquired:

```go
var _self *Singleton
var mu sync.Mutex

func Instance(name string) *Singleton {
    if _self == nil {
        mu.Lock()
        defer mu.Unlock()
        if _self == nil {
            _self = NewInstance(name)
        }
    }
    return _self
}
```

### Idiomatic Go with sync.Once

Go provides `sync.Once`, which guarantees that a function is executed exactly once regardless of how many goroutines call it. This is the preferred idiomatic solution:

```go
type Singleton struct {
    Name string
    sync.Once
}

func (s *Singleton) Instance(name string) *Singleton {
    s.Do(func() {
        s.Name = name
    })
    return s
}
```

`sync.Once` encapsulates the double-checked locking pattern internally and is simpler to maintain than a manual mutex-based implementation.
