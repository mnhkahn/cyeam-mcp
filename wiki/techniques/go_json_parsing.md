---
title: Go JSON Parsing
type: techniques
created: 2014-07-09
last_updated: 2024-11-16
related: ["[[beego]]", "[[BaiduYunPush]]", "[[Go Unicode Handling]]", "[[Go Data Structures]]", "[[Go Strings]]", "[[Go Tooling]]"]
sources: ["77a6bd5f1b1b", "68174d19ac76", "9ddce37c1d9f", "47435813bc6b", "03e37336a228"]
---

# Go JSON Parsing

In July 2014, the subject documented two approaches for handling JSON with uncertain structure in Go.

## Unified Struct for Variable Responses

When integrating third-party APIs, the same endpoint may return different fields depending on success or failure. The subject's initial approach defined two separate structs and tried to unmarshal into each, a method they later called a "dirty hack."

A simpler solution is to define one struct containing the union of all possible fields:

```go
type Result struct {
    Status       int    `json:"status"`
    Message      string `json:"message"`
    ErrorCode    int    `json:"error_code"`
    ErrorMessage string `json:"error_message"`
}
```

`json.Unmarshal` populates only the fields present in the input. Missing fields retain their zero values. This eliminates the need for multiple structs or conditional unmarshaling.

## Dynamic Unmarshaling

For completely unknown JSON structures, unmarshal into an empty `interface{}`. The result is a `map[string]interface{}` that can be inspected at runtime.

## Number Handling

In May 2016, the subject investigated how `encoding/json` handles numeric values when the destination type is `interface{}`. By default, JSON numbers are unmarshaled into `float64`, not `int64` or any other integer type. This is because the decoder's `convertNumber` function calls `strconv.ParseFloat(s, 64)` when the target is an interface.

```go
var data map[string]interface{}
json.Unmarshal([]byte(`{"10000000000":10000000000,"111":1}`), &data)
// data["10000000000"] is a float64, not an int64
```

When a concrete numeric type is specified, the decoder uses the appropriate `strconv` function (`ParseInt`, `ParseUint`, or `ParseFloat`) and checks for overflow. To preserve numeric precision without committing to a concrete type, use `json.Number`:

```go
var data map[string]json.Number
json.Unmarshal([]byte(`{"10000000000":10000000000}`), &data)
// data["10000000000"] is a json.Number (a string wrapper)
```

### json.Number for Heterogeneous Input

In August 2018, the subject explored using `json.Number` when a JSON field may contain a number literal in some responses and a numeric string in others. Declaring the field as `json.Number` allows `Unmarshal` to accept both forms without custom `MarshalJSON` logic. `json.Number` is defined as `type Number string` and provides `String()`, `Float64()`, and `Int64()` methods for later conversion.

When decoding into `map[string]interface{}`, the default behavior unmarshals numbers as `float64`, which can lose precision for large integers. Calling `decoder.UseNumber()` on a `json.Decoder` overrides this so that all numeric values are stored as `json.Number` instead.

## Selective Field Marshaling

In April 2017, the subject published a small utility package (`jsonfield`) that marshals a struct into JSON while emitting only a specified subset of fields. This is useful for debugging endpoints where the full payload is unnecessary. The API accepts a struct followed by a variadic list of field names to include:

```go
byts, err := jsonfield.Marshal(jj, "A") // {"A":111}
```
