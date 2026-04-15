---
title: Monkey Patching in Go
type: techniques
created: 2018-08-07
last_updated: 2018-08-07
related: ["[[Go Testing]]", "[[Go Tooling]]", "[[Go Concurrency]]"]
sources: ["0fb3249578a1"]
---

# Monkey Patching in Go

Monkey patching is the practice of modifying or extending code at runtime. In August 2018, the subject studied how to replace the body of a Go function at runtime by rewriting its machine code in memory, a technique useful for mocking dependencies during unit testing.

## Function Values in Go

In Go, a function value is not a direct pointer to the function's code. Instead, it is a pointer to a `funcval` struct that contains the actual code pointer in its `fn` field. This indirection supports closures and method values by allowing extra data to travel with the function reference.

```go
type funcval struct {
    fn uintptr
    // variable-size, fn-specific data here
}
```

When a function value is called, the address of the `funcval` is loaded into a register (e.g., `rdx` on x86-64), the code pointer is dereferenced, and control jumps to that address.

## Runtime Replacement

To redirect a function `a` to another function `b`, the subject overwrote the first few bytes of `a`'s machine code with a short assembly stub that loads `b`'s `funcval` address into `rdx` and jumps to it:

```asm
mov rdx, main.b.f
jmp [rdx]
```

The corresponding machine-code bytes are generated dynamically from the target function value. Because executable memory is typically read-only, the page containing the original function must be made writable with `syscall.Mprotect` before the overwrite.

## Practical Library

The technique was packaged into the open-source library `bouk/monkey`, which supports:

- Patching functions on 32-bit and 64-bit architectures.
- Reverting patches.
- Patching methods on instances.

The subject noted that this approach relies on unsafe operations and platform-specific assembly, so it should be reserved for testing environments rather than production code.
