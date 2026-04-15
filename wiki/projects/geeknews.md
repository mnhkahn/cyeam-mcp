---
title: GeekNews
type: projects
created: 2026-03-12
last_updated: 2026-03-12
related: ["[[Model Context Protocol]]", "[[OpenAI Integration]]", "[[Web Scraping]]"]
sources: ["4349850345ad"]
---

# GeekNews

GeekNews is an AI-curated technology news aggregation service built by the subject. It collects headlines from multiple RSS feeds, generates AI summaries, and presents them in a unified interface.

## Architecture

The system follows a three-tier design:

- **Web frontend** — fetches a JSON feed and renders the news list.
- **Application layer** — runs a scheduled job to pull news, stores it as JSON, and refreshes the cache.
- **MCP service layer** — concurrently fetches RSS sources, sorts items by time, truncates to a daily digest, and uses an LLM to generate concise summaries.

Data sources include third-party RSS feeds and a daily JSON snapshot stored on disk.

## MCP Transport Evolution

In March 2026, the subject migrated the underlying MCP server from the legacy SSE transport to the newer **Streamable HTTP** transport recommended by the official specification.

| Dimension | stdio | Streamable HTTP | HTTP with SSE (legacy) |
|---|---|---|---|
| Communication | stdin/stdout JSON-RPC | Single HTTP endpoint with POST/GET and SSE streaming | Dual endpoints: SSE GET + HTTP POST |
| Deployment | Local only | Local, LAN, or cloud | Local, LAN, or cloud |
| Lifecycle | Tied to client process | Independent server with session management | Independent server |
| Multi-client | One client per server process | Native multi-client and load balancing | Supports multiple clients |
| Recovery | None on disconnect | Built-in SSE resume via `Last-Event-ID` | Must reconnect manually |
| Performance | Sub-millisecond latency, minimal overhead | Network-dependent, streaming optimizes latency | Network-dependent, higher reconnect cost |
| Security | No network exposure | Requires HTTPS, auth, and firewall rules | Requires HTTPS and auth |

## Go SDK Migration

The server and client were rewritten with the official Go MCP SDK using `StreamableClientTransport`:

```go
server := mcp.NewServer(&mcp.Implementation{Name: "greeter"}, nil)
mcp.AddTool(server, &mcp.Tool{Name: "greet", Description: "say hi"}, SayHi)
handler := mcp.NewStreamableHTTPHandler(func(r *http.Request) *mcp.Server {
    return server
}, nil)
```

The client connects to the streamable endpoint and invokes tools via a typed session API.
