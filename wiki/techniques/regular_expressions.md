---
title: Regular Expressions
type: techniques
created: 2014-07-02
last_updated: 2014-07-02
related: ["[[Linux Shell Commands]]", "[[Java Interview Preparation]]"]
sources: ["b428c7306524"]
---

# Regular Expressions

In July 2014, the subject compiled a reference on regular expressions, noting them as an essential skill for hackers and a listed competency in the Knownsec skills matrix.

## Use Cases

The subject identified three primary applications:

- Input validation.
- Log filtering with `grep`.
- Matching HTML tags.

## Core Syntax

| Pattern | Meaning |
|---------|---------|
| `\b` | Word boundary |
| `\d` | Digit |
| `\s` | Whitespace |
| `\w` | Word character (letters, digits, underscore, Chinese characters) |
| `^` | Start of string |
| `$` | End of string |
| `.` | Any character except newline |
| `*` | Zero or more repetitions |
| `+` | One or more repetitions |
| `?` | Zero or one repetition |
| `{n}` | Exactly n repetitions |
| `{n,}` | At least n repetitions |
| `{n,m}` | Between n and m repetitions |
| `[]` | Character class |
| `\|` | Alternation |
| `()` | Capturing group |
| `(?:exp)` | Non-capturing group |
| `(?=exp)` | Positive lookahead |
| `(?!exp)` | Negative lookahead |

## Lazy Quantifiers

Appending `?` to a quantifier makes it lazy, matching as few characters as possible:

- `*?` — zero or more, minimal.
- `+?` — one or more, minimal.
- `??` — zero or one, minimal.
- `{n,m}?` — between n and m, minimal.

## Common Patterns

- QQ number: `^\d{5,12}$`
- First word of a line: `^\w+`
- Phone number variants: `\(?0\d{2}[) -]?\d{8}`
- IP address (strict): `((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)`
- Repeated words: `\b(\w+)\b\s+\1\b`
- Words ending in "ing" (stem only): `\b\w+(?=ing\b)`
