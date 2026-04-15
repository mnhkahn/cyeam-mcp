---
title: C Program Compilation
type: techniques
created: 2014-05-15
last_updated: 2014-05-15
related: ["[[C++ Memory and Objects]]", "[[The Self-Cultivation of a Programmer]]"]
sources: ["7b4d19acf73f"]
---

# C Program Compilation

In May 2014, the subject studied the compilation pipeline by tracing how a classic "hello, world" program becomes an executable, using notes from *Computer Systems: A Programmer's Perspective*.

## Preprocessing

The preprocessor expands `#include` directives and macro definitions, converting `.c` files into `.i` files.

```bash
gcc -E hello.c -o hello.i
```

For the example program, this produced an 845-line intermediate file.

## Compilation

The compiler translates the preprocessed file into assembly:

```bash
gcc -S hello.i -o hello.s
```

The generated assembly defines a read-only string constant in the `.rodata` section and the `main` function in the `.text` section. Key instructions observed included:

- `pushq %rbp` — save the base pointer.
- `movq %rsp, %rbp` — establish the stack frame.
- `movl $.LC0, %edi` — load the address of the string into the `edi` register.
- `call puts` — invoke `puts`, which appends a newline automatically.

The subject noted that `%r`-prefixed registers are 64-bit and `%e`-prefixed registers are 32-bit, and that `q` suffixes indicate 64-bit operations.

## Assembly

The assembler converts assembly into a relocatable object file:

```bash
gcc -c hello.s -o hello.o
```

## Linking

The linker merges the object file with required library objects (such as `printf.o`) to produce the final executable:

```bash
gcc hello.o -o hello
```
