---
title: Network Port Numbers
type: techniques
created: 2015-03-14
last_updated: 2015-03-14
related: ["[[DNS Protocol]]", "[[HTTP Protocol Analysis]]"]
sources: ["7e0881842fb6"]
---

# Network Port Numbers

In the TCP and UDP protocols, a port number is a 16-bit unsigned integer, which limits the valid range to 0 through 65,535. In March 2015, the subject encountered a bug where a Thrift service failed to start because it was configured to listen on port 99,999, which exceeds this limit.

## Protocol Structure

Both TCP and UDP headers allocate 16 bits for the source port and 16 bits for the destination port:

- **UDP header** — the source and destination ports occupy bits 96 through 127 of the datagram header.
- **TCP header** — the source and destination ports occupy the first 32 bits (bits 0 through 31) of the segment header.

Because higher-layer protocols are built on top of TCP or UDP, their port assignments must also fall within the 16-bit range. Well-known examples include:

- HTTP — port 80
- HTTPS — port 443
- DNS — port 53
- SSH — port 22

## Port Categories

| Range | Category |
|---|---|
| 0 – 1023 | Well-known ports (assigned by IANA) |
| 1024 – 49151 | Registered ports |
| 49152 – 65535 | Dynamic / private ports |

The 16-bit width is a fundamental constraint of the IPv4 and IPv6 transport layers; no valid TCP or UDP port can exceed 65,535 regardless of the application protocol layered above it.
