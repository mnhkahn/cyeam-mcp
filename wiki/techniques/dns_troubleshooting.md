---
title: DNS Troubleshooting
type: techniques
created: 2026-03-21
last_updated: 2026-03-21
related: ["[[DNS Protocol]]", "[[Linux Network Troubleshooting]]", "[[HTTP Protocol Analysis]]"]
sources: ["fab1af737c75"]
---

# DNS Troubleshooting

In March 2026, the subject investigated intermittent domain-resolution failures after switching DNS servers. The symptoms appeared in Chrome as generic connection errors (`ERR_CONNECTION_CLOSED`), which obscured the root cause.

## Diagnostic Steps

1. **Confirm the site is actually down** — use third-party checkers such as `downforeveryoneorjustme.com` or multi-location ping tools.
2. **Query NS records** — verify which name servers are authoritative:
   ```bash
   while true; do dig example.com NS +short; sleep 20; done
   ```
3. **Query A/AAAA records** — check what IPs are being returned:
   ```bash
   while true; do dig example.com AAAA +short; sleep 20; done
   ```
4. **Validate the resolved IP** — use IP lookup services to confirm whether the address belongs to the expected provider (for example, Cloudflare).
5. **Inspect browser DNS cache** — in Chrome, `chrome://net-internals/#dns` shows the exact records the browser is using, including any `ech_config_list` or alternative endpoints.

## ECH Config List Issue

The root cause in this case was an `ech_config_list` DNS record injected by Cloudflare. This record carries encrypted-client-hello configuration and edge-node IPs. Chrome prioritizes the alternative endpoint and attempts to connect via ECH. When the server or network path cannot handle ECH, the TCP connection is closed immediately, producing the `ERR_CONNECTION_CLOSED` error. Disabling ECH at the client level resolved the issue.
