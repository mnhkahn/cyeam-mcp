---
title: HTTP Protocol Analysis
type: techniques
created: 2012-11-02
last_updated: 2018-02-07
related: ["[[Java Interview Preparation]]", "[[Go Data Structures]]", "[[beego]]", "[[Linux Network Troubleshooting]]", "[[Go Performance Optimization]]", "[[Go Reflection]]"]
sources: ["da863025096e", "671050dc0d06", "4b89cc00bc6e", "260ea296e8b5", "78afbe7f8b9c", "eaf9d134d567"]
---

# HTTP Protocol Analysis

## Request Flow

An entry from November 2012 documented the complete network flow of requesting `http://www.bit.edu.cn/index.htm` using packet capture tools.

### DNS Resolution

The client first checked the local DNS cache. Because the record for `www.bit.edu.cn` was already cached, no external DNS query was needed. After flushing the cache, a query to the local DNS server (`10.0.0.10`) returned the IPv4 address `10.0.6.30`, followed by a separate query for the IPv6 address.

### TCP Connection

The client established a TCP connection to `10.0.6.30` on port 80. The three-way handshake was observed in detail:

1. **SYN** — sequence number 0
2. **SYN-ACK** — sequence number 0, acknowledgment 1
3. **ACK** — sequence number 1, acknowledgment 1

### HTTP Response

The server responded with `index.htm`. Response headers identified the server as `Apache/2.2.6 (Unix) mod_jk/1.2.27`. The HTML contained references to JavaScript files, CSS stylesheets, images, and a favicon. Each additional resource required its own TCP connection and HTTP request.

### Form Submission

A parallel example showed logging into `126.com`. The login form data, including username and password, was transmitted in encrypted form within the HTTP POST body.

## Message Format

In September 2014, the subject studied HTTP message structure by simulating requests over raw TCP sockets in Go. An HTTP transaction consists of establishing a TCP connection to a specific IP and port, then sending a request command, headers, and optional body data; the server returns its response over the same connection.

### Request Components

An HTTP request is divided into three parts, separated by line terminators:

1. **Request line** — the HTTP method, path, and protocol version (e.g., `GET / HTTP/1.0`).
2. **Headers** — one or more key-value pairs.
3. **Body** — optional payload, separated from the headers by an empty line.

The standard line terminator defined in RFC specifications is the two-character sequence CRLF (`\r\n`). While many servers also accept a single newline (`\n`), robust implementations should use CRLF. In Go's `net/http` package (`request.go`), headers are written with explicit CRLF terminators:

```go
fmt.Fprintf(w, "Host: %s\r\n", host)
fmt.Fprintf(w, "User-Agent: %s\r\n", userAgent)
```

When sending a body, the `Content-Length` header must specify the exact byte length of the payload; otherwise the server may not read the body.

### Simulation Tools

The subject used several tools to observe raw HTTP traffic:

- **telnet** — establishes a TCP connection and allows manual typing of the request line and headers. Two consecutive line breaks send the request.
- **Postman** — a browser extension that can preview the complete raw request, including all headers and body data.
- **beego** — a Go web framework used to run a local server so the subject could inspect exactly what the server received.

## Timeouts

HTTP involves two distinct timeout phases, which explains why some Go HTTP client wrappers expose two timeout parameters (connect timeout and read/write timeout):

1. **Connection timeout** — the time allowed to establish the TCP connection.
2. **Request timeout** — the time allowed to send the HTTP request and receive a response.

In Go's `net/http` source code, request-level cancellation is handled in `client.go` via `time.AfterFunc`, while the transport layer enforces TLS handshake timeouts in `transport.go` during `dialConn`. Both mechanisms rely on Go's `time.AfterFunc` to trigger cancellation if the deadline is exceeded.

## Content Encoding

In November 2014, the subject implemented gzip-compressed HTTP requests in Go to reduce payload size. HTTP compression is negotiated through the `Content-Encoding` and `Accept-Encoding` headers. The subject observed that gzip can reduce data volume by 80–90% without significantly increasing response time.

Go's `compress/gzip` package provides a `Reader` that implements the standard `io.Reader` interface. After sending a request with `Accept-Encoding: gzip`, the response body can be decompressed by wrapping it in `gzip.NewReader` and reading through `ioutil.ReadAll`, which internally calls the `Read` method and buffers the result.

```go
client := http.Client{}
req, _ := http.NewRequest("GET", "http://example.com", nil)
req.Header.Add("Accept-Encoding", "gzip")
resp, _ := client.Do(req)
defer resp.Body.Close()

compressed, _ := ioutil.ReadAll(resp.Body)
reader, _ := gzip.NewReader(resp.Body)
uncompressed, _ := ioutil.ReadAll(reader)
```

This approach leverages Go's composable I/O interfaces: `gzip.Reader` adapts the compressed HTTP response body to a plain `io.Reader`, allowing any consumer that expects `io.Reader` to work transparently.

## Minimal HTTP Server

In December 2015, the subject implemented a minimal HTTP server in Go over raw TCP to study the server side of the protocol. The implementation listens on a TCP port, accepts connections, and writes a properly formatted HTTP response.

An HTTP response consists of three parts:

1. **Status line** — protocol version and status code, terminated by `CRLF` (`\r\n`).
2. **Headers** — one or more key-value pairs, each terminated by `CRLF`.
3. **Body** — optional payload, separated from the headers by an additional `CRLF`.

No `CRLF` is required after the body.

```go
func handleConnection(conn net.Conn) {
    defer conn.Close()
    buffers := bytes.Buffer{}
    buffers.WriteString("HTTP/1.1 200 OK\r\n")
    buffers.WriteString("Server: Cyeam\r\n")
    buffers.WriteString("Date: " + time.Now().Format(time.RFC1123) + "\r\n")
    buffers.WriteString("Content-Type: text/html; charset=utf-8\r\n")
    buffers.WriteString("Content-length:" + fmt.Sprintf("%d", len(html)) + "\r\n")
    buffers.WriteString("\r\n")
    buffers.WriteString(html)
    conn.Write(buffers.Bytes())
}
```

The server loop accepts connections and dispatches each to `handleConnection` in its own goroutine:

```go
ln, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
if err != nil {
    panic(err)
}
for {
    conn, err := ln.Accept()
    if err != nil {
        log.Panicln(err)
    }
    go handleConnection(conn)
}
```

Closing the connection with `defer conn.Close()` is essential to free the underlying TCP socket.

## Connection Management and Keep-Alive

In May 2017, the subject investigated a high volume of `TIME_WAIT` connections observed during load testing of a Go HTTP server. A large `TIME_WAIT` count indicates that the server is actively closing TCP connections. Frequent connection teardown wastes resources because each TCP close waits for twice the maximum segment lifetime (roughly one minute by default), consuming memory and port capacity.

### Go `net/http` Server Mechanics

Go's HTTP server accepts connections in a loop and dispatches each connection to a goroutine running `conn.serve()`. Inside `serve()`, a second loop handles multiple requests on the same connection when keep-alive is enabled:

```go
func (c *conn) serve() {
    defer c.close()
    for {
        w, err := c.readRequest()
        // ...
        serverHandler{c.server}.ServeHTTP(w, w.req)
    }
}
```

The loop exits on error or timeout, after which the deferred `close()` terminates the TCP connection.

### Timeout Behavior

`readRequest` sets read and write deadlines on the underlying `net.Conn` before parsing the HTTP request:

- `SetReadDeadline` — an absolute time after which `Read` calls will fail.
- `SetWriteDeadline` — an absolute time after which `Write` calls will fail.

In the beego framework at the time, `HttpServerTimeOut` configured both deadlines simultaneously. The subject discovered that the read deadline was set before `ReadRequest`, which meant the deadline covered not only data transfer but also the idle wait between requests. If no new request arrived within the timeout window, the connection was closed, producing `TIME_WAIT`.

Similarly, the write deadline was set after the request was read but before the response was written, so it covered both handler execution time and response transmission. Under load, slow handler logic could trigger the write deadline and close the connection.

### Recommended Timeout Strategy

The subject concluded that robust server timeout configuration should separate three concerns:

1. **Read timeout** — time allowed to read the request body, excluding idle wait.
2. **Write timeout** — time allowed to write the response, ideally excluding handler execution.
3. **Idle timeout** — time the server waits for the next request on a keep-alive connection.
4. **Handler timeout** — time allowed for business logic, independent of network I/O. Go's `http.TimeoutHandler` provides this, although the subject noted that beego did not expose it at the time.

Go 1.8 introduced `Server.IdleTimeout` to address the idle-wait issue, but if `IdleTimeout` is not set and `ReadTimeout` is configured, `ReadTimeout` still governs the idle period for backward compatibility.

## Inspecting Registered Routes

In February 2018, the subject demonstrated how to inspect the unexported route map inside `http.ServeMux` using reflection. The standard library stores routes in a private field `m map[string]muxEntry`, and there is no public getter. Because `ServeMux` is accessible, reflection can read its internal state:

```go
v := reflect.ValueOf(mux)
m := v.Elem().FieldByName("m")
keys := m.MapKeys()
routers := make([]string, 0, len(keys))
for _, key := range keys {
    routers = append(routers, key.String())
}
sort.Strings(routers)
```

This technique is useful for debugging or generating API documentation when the application does not maintain its own route registry.
