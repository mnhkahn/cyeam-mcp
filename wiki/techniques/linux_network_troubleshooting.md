---
title: Linux Network Troubleshooting
type: techniques
created: 2015-08-27
last_updated: 2019-03-18
related: ["[[Linux Shell Commands]]", "[[HTTP Protocol Analysis]]", "[[maodou]]", "[[Host File Management]]"]
sources: ["a61aabb7c26e", "bda96207846b"]
---

# Linux Network Troubleshooting

## Too Many Open Files

In August 2015, the subject encountered a `too many open files` error in a Go web crawler. The error manifested during HTTP POST requests:

```
Post http://api.duoshuo.com/posts/import.json: dial tcp: lookup api.duoshuo.com: too many open files
```

On Linux, sockets are treated as file descriptors. The default per-process limit is 1,024 open file descriptors. When sockets are opened faster than they are closed, the process exhausts this quota and all new network operations fail.

### Diagnosing Socket Leaks

The subject diagnosed the leak using several techniques:

- **Per-process file descriptors** — `/proc/{pid}/fd/` contains a symbolic link for every open file descriptor. Counting the entries approximates the number of open sockets:
  ```bash
  ll /proc/{pid}/fd/ | wc -l
  ```

- **TCP connection table** — `/proc/net/tcp` lists all TCP connections in hexadecimal. Local and remote addresses are stored in little-endian hex and can be converted to dotted-decimal notation. For example, `BE848368:80E5` translates to `104.131.132.190:32997`.

- **netstat** — `netstat -p` shows active connections and their associated processes. The subject used `netstat -p | grep haixiuzu` to isolate connections belonging to the crawler.

### Connection States

A large number of connections in `CLOSE_WAIT` state indicated that the local side had received a FIN from the remote peer but had not closed its own socket. In the subject's case, 30 `CLOSE_WAIT` connections accumulated after each crawl batch. Non-zero values in the `Recv-Q` or `Send-Q` columns suggested that data was queued and waiting, a symptom of incomplete connection teardown.

### Root Cause and Fix

The root cause was a missing `resp.Body.Close()` call in the Go HTTP client code. In Go's `net/http` package, the response body must be explicitly closed to release the underlying TCP connection back to the connection pool or to terminate it. Adding the missing close call eliminated the `CLOSE_WAIT` accumulation and resolved the `too many open files` error.

## Host Resolution in Docker

In March 2019, the subject investigated why `/etc/hosts` entries inside a Docker container were ignored by a Go HTTP client. On Linux, name resolution order is controlled by `/etc/nsswitch.conf`. A typical configuration is:

```
hosts: files dns
```

This means the system consults `/etc/hosts` first, then falls back to DNS. When `/etc/nsswitch.conf` is absent, Go's resolver applies a glibc-compatible default on Linux: `dns [!UNAVAIL=return] files`. Under this default, DNS is tried first; only if the DNS server is unavailable does the resolver check local files. Consequently, `/etc/hosts` can be silently ignored in Docker images that omit `nsswitch.conf`. The fix is to ensure the container includes the file with the desired resolution order.
