---
title: Go Reflection
type: techniques
created: 2014-08-11
last_updated: 2014-08-11
related: ["[[Go JSON Parsing]]", "[[Go Interfaces]]", "[[Go Data Structures]]"]
sources: ["32363c79a727"]
---

# Go Reflection

The `reflect` package in Go provides runtime introspection of types and values. It is the foundation for generic serialization libraries, including the standard `encoding/json` package.

## Type and Value

`reflect.TypeOf` returns the dynamic type of an interface value, and `reflect.ValueOf` returns a `Value` encapsulating the concrete value.

```go
c := Cyeam{Url: "blog.cyeam.com", Other: "..."}
t := reflect.TypeOf(c)
v := reflect.ValueOf(c)
```

## Inspecting Struct Fields

A `reflect.Type` representing a struct exposes field metadata:

```go
for i := 0; i < t.NumField(); i++ {
    field := t.Field(i)
    value := v.FieldByName(field.Name)
    tag := field.Tag.Get("json")
}
```

## Struct Tags

Struct tags are string literals attached to struct fields, conventionally used to guide marshaling behavior. The `json` tag controls field naming and omission:

```go
type Cyeam struct {
    Url   string `json:"url"`
    Other string `json:"-"`
}
```

A tag value of `-` causes the field to be skipped during JSON encoding.

## Manual JSON Encoding Example

Using reflection, the subject constructed a minimal JSON encoder:

```go
json := "{"
for i := 0; i < t.NumField(); i++ {
    if t.Field(i).Tag.Get("json") != "-" {
        json += "\"" + t.Field(i).Tag.Get("json") + "\":\"" +
                v.FieldByName(t.Field(i).Name).String() + "\""
    }
}
json += "}"
```

This outputs `{"url":"blog.cyeam.com"}` for the example struct.
