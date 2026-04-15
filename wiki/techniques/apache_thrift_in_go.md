---
title: Apache Thrift in Go
type: techniques
created: 2014-07-22
last_updated: 2015-07-31
related: ["[[Go Interfaces]]", "[[Go flag Package]]", "[[Web Architecture Concepts]]", "[[Go Binary Encoding]]"]
sources: ["ef5dfdde60cc", "c1d8a1ddc025"]
---

# Apache Thrift in Go

Apache Thrift is a cross-language remote procedure call (RPC) framework developed at Facebook and later open-sourced under the Apache Foundation. It enables lightweight service communication without relying on HTTP or manual JSON/XML parsing.

## Comparison with Web Service Formats

Traditional web services typically use JSON (REST) or XML (SOAP) over HTTP. Thrift bypasses the HTTP layer entirely: services are defined in a `.thrift` IDL file, and the framework generates client and server code that maps remote calls directly to local method invocations.

## Defining a Service

A Thrift service definition specifies interfaces and data types. The following `Hello.thrift` defines five operations:

```thrift
namespace java service.demo
service Hello {
    string helloString(1:string para)
    i32 helloInt(1:i32 para)
    bool helloBoolean(1:bool para)
    void helloVoid()
    string helloNull()
}
```

## Code Generation

The Thrift compiler generates language-specific bindings. For Go:

```bash
thrift --gen go Hello.thrift
```

This produces a `gen-go` directory containing an interface such as:

```go
type Hello interface {
    HelloString(para string) (r string, err error)
    HelloInt(para int32) (r int32, err error)
    HelloBoolean(para bool) (r bool, err error)
    HelloVoid() (err error)
    HelloNull() (r string, err error)
}
```

## Server Implementation

The server implements the generated interface and wires it to a transport and protocol.

```go
type HelloHandler struct{}

func NewHelloHandler() *HelloHandler {
    return &HelloHandler{}
}

func (h *HelloHandler) HelloString(para string) (string, error) {
    return "hello, world", nil
}

func (h *HelloHandler) HelloBoolean(para bool) (r bool, err error) {
    return para, nil
}

func (h *HelloHandler) HelloInt(para int32) (r int32, err error) {
    return para, nil
}

func (h *HelloHandler) HelloVoid() (err error) {
    return nil
}

func (h *HelloHandler) HelloNull() (r string, err error) {
    return "hello null", nil
}
```

Server bootstrap:

```go
func runServer(transportFactory thrift.TTransportFactory,
               protocolFactory thrift.TProtocolFactory,
               addr string) error {
    transport, err := thrift.NewTServerSocket(addr)
    if err != nil {
        fmt.Println(err)
    }
    handler := NewHelloHandler()
    processor := hello.NewHelloProcessor(handler)
    server := thrift.NewTSimpleServer4(processor, transport, transportFactory, protocolFactory)
    fmt.Println("Starting the simple server... on ", addr)
    return server.Serve()
}
```

## Client Implementation

The client opens a socket, wraps it with the same transport and protocol, and invokes generated methods directly.

```go
func handleClient(client *hello.HelloClient) error {
    str, err := client.HelloString("")
    fmt.Println(str)
    return err
}

func runClient(transportFactory thrift.TTransportFactory,
               protocolFactory thrift.TProtocolFactory,
               addr string) error {
    transport, err := thrift.NewTSocket(addr)
    if err != nil {
        fmt.Println("Error opening socket:", err)
        return err
    }
    transport = transportFactory.GetTransport(transport)
    defer transport.Close()
    if err := transport.Open(); err != nil {
        return err
    }
    return handleClient(hello.NewHelloClientFactory(transport, protocolFactory))
}
```

Running the client against `localhost:9090` prints `hello, world`.

## Serialization and Versioning

In July 2015, the subject encountered a production bug caused by Thrift's binary serialization behavior. A partner team modified an IDL struct by inserting a new field at the beginning of the definition. Because the caller had not yet upgraded, the client deserialized the binary payload incorrectly, producing negative integers and corrupted data.

The root cause is that Thrift encodes struct fields using their numeric field identifiers and type specifiers, not their names. The field header for every member contains a unique field ID and a type specifier; the decoder uses this combination to identify each field. When a new field is inserted at the beginning of a struct without careful versioning, existing clients that do not recognize the new field ID may misalign the remaining fields if the binary layout changes.

For example, given the following IDL:

```thrift
struct Pair {
    1: required string key
    2: required string value
}
```

If the field order is swapped in the IDL without updating all clients and servers simultaneously:

```thrift
struct Pair {
    2: required string key
    1: required string value
}
```

An old client decoding a response from a new server will map the first value (now `value`) to `key` and the second value (now `key`) to `value`, because the decoder relies on the field ID to locate data in the binary stream.

Thrift's documentation recommends always explicitly specifying field identifiers rather than relying on automatic assignment, because automatic assignment can shift identifiers when fields are added or reordered. Safe evolution requires adding new fields with new identifiers and never reusing or renumbering existing identifiers.
