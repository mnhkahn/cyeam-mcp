---
title: Go Validation
type: techniques
created: 2025-04-25
last_updated: 2025-04-25
related: ["[[Go Tooling]]", "[[Go JSON Parsing]]", "[[Go Data Structures]]"]
sources: ["8d475c3c60ea"]
---

# Go Validation

In April 2025, the subject documented how to perform struct validation in Go using the `github.com/go-playground/validator/v10` package.

## Map-Based Rules

The validator instance can register a set of tag-style rules against a struct type with `RegisterStructValidationMapRules`. This allows validation logic to be declared in one place rather than scattered across struct tags:

```go
var rules = map[string]string{
    "NotNull":        "required",
    "LargerThanZero": "gt=0",
    "Enum":           "required,oneof=1 2 3",
}

v.RegisterStructValidationMapRules(rules, Struct{})
```

## Common Tags

- `required` — the field must be present and non-zero.
- `gt=0` — the numeric field must be greater than zero.
- `oneof=1 2 3` — the field must match one of the listed values.

## Validation Flow

Calling `v.Struct(x)` validates every field according to the registered rules. It returns an aggregated error when any constraint is violated, making it suitable for use with standard test assertions.
