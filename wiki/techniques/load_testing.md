---
title: Load Testing
type: techniques
created: 2014-11-11
last_updated: 2014-11-11
related: ["[[HTTP Protocol Analysis]]", "[[Web Architecture Concepts]]", "[[Linux Shell Commands]]"]
sources: ["c60b7feaa41f"]
---

# Load Testing

Load testing is used to verify the performance and stability of an interface or service under concurrent demand. It helps identify slow response times, database query inefficiencies, and memory leaks by measuring metrics such as average response time and requests per second.

## Apache Bench

Apache Bench (`ab`) is a command-line tool distributed with the Apache HTTP Server project. A common invocation pattern is:

```bash
ab -c 10 -n 100 http://www.example.com/
```

- `-c` — number of concurrent requests.
- `-n` — total number of requests to perform.

The output includes:

- **Requests per second** — total throughput.
- **Time per request** — mean response time for all concurrent requests.
- **Time per request (across all concurrent requests)** — mean time for a single request.

The subject noted a practical quirk: the target URL must end with a trailing slash; otherwise `ab` reports an `invalid URL` error.

## Capacity Estimation

From load-test results, one can estimate required server capacity. For example, if a single server handles 47 requests per second with a 21 ms per-request mean, achieving 1,000 requests per second would require roughly 21 servers, assuming linear scaling.

## Best Practices

- Test against the local IP and port rather than a public domain, so that CDN, Nginx, and network latency do not obscure the true application performance.
- Monitor system resources (for example with `top`) during the test to detect memory leaks or CPU bottlenecks.
- For related interfaces, perform both individual and combined load tests to observe how upstream pressure affects downstream endpoints.
