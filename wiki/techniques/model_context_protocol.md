---
title: Model Context Protocol
type: techniques
created: 2025-04-17
last_updated: 2026-03-12
related: ["[[OpenAI Integration]]", "[[LangSmith]]", "[[Go HTTP Client]]", "[[Go Tooling]]", "[[GeekNews]]"]
sources: ["17bce81bd27a", "00d43805338f", "211f5d8be364", "306947d848c9", "4349850345ad"]
---

# Model Context Protocol

In April 2025, the subject began experimenting with the Model Context Protocol (MCP), an open standard for connecting large language models (LLMs) to external data sources and tools.

## Architecture

MCP separates concerns into four roles:

- **Host** — the AI application (for example, an IDE plugin such as Cline or Trae) that initiates requests.
- **Client** — a protocol client embedded in the host that maintains a 1:1 connection with a server.
- **Server** — a lightweight service that exposes tools, resources, or prompts over MCP.
- **Data sources** — local files, databases, or remote APIs that the server can access.

## Transports

MCP supports multiple transports. The subject has worked with three variants:

- **stdio** — local process communication via standard input and output. Suitable for command-line tools running on the same machine.
- **SSE (Server-Sent Events)** — HTTP-based streaming with a dual-endpoint design (legacy, now deprecated).
- **Streamable HTTP** — a single HTTP endpoint that supports both synchronous JSON responses and SSE streaming, with built-in session management and resume via `Last-Event-ID`. This is the current official recommendation.

Because SSE is a long-lived HTTP connection, hosts that set aggressive read or write timeouts must disable them for the MCP endpoints to avoid `context deadline exceeded` errors.

## Message Format

MCP uses JSON-RPC 2.0. A request carries an `id`, a `method`, and optional `params`. A response echoes the same `id` and contains either a `result` or an `error`. Notifications omit the `id` and do not expect a reply.

## Go Implementation

The subject built servers with both the `github.com/ThinkInAIXYZ/go-mcp` library and the official Go MCP SDK.

### Registering a Tool

A tool is registered with a name, description, and an input schema struct:

```go
tool, err := protocol.NewTool("current_time", "Get current time for specified timezone", TimeRequest{})
mcpServer.RegisterTool(tool, handleTimeRequest)
```

The handler receives the arguments, validates them, and returns a `CallToolResult` containing one or more content items (text, images, audio, etc.).

### Integrating with an Existing HTTP Server

For legacy SSE, the transport object exposes two handlers that can be mounted on a custom router:

```go
app.Handle("/sse", sseHandler.HandleSSE())
app.Handle("/sse/message", sseHandler.HandleMessage())
```

For Streamable HTTP, a single handler is sufficient:

```go
handler := mcp.NewStreamableHTTPHandler(func(r *http.Request) *mcp.Server {
    return server
}, nil)
app.Handle("/mcp", http.HandlerFunc(handler.ServeHTTP))
```

### stdio Example

For local tools, the transport is initialized with `NewStdioServerTransport`. Environment variables are read from `os.Environ()` to configure secrets (for example, Cloudinary credentials for an image-upload tool).

### Streamable HTTP Client

```go
client := mcp.NewClient(&mcp.Implementation{Name: "mcp-client", Version: "v1.0.0"}, nil)
transport := &mcp.StreamableClientTransport{Endpoint: "http://localhost:1031/mcp"}
session, err := client.Connect(ctx, transport, nil)
```

## Resources

In May 2025, the subject explored MCP resources. A resource is a piece of contextual data identified by a URI. Servers can expose:

- **Static resource lists** — returned by `resources/list`.
- **Parameterized templates** — returned by `resources/templates/list`.
- **Subscriptions** — clients can subscribe to a URI and receive `notifications/resources/list_changed` when the data changes.

Common URI schemes include `https://`, `file://`, and `git://`. Resource contents are typed with a MIME type such as `text/plain`, `text/html`, or `application/json`.

## Inspector

The official MCP Inspector can be launched with `npx` to test a remote server interactively:

```bash
npx @modelcontextprotocol/inspector https://www.cyeam.com/sse
```
