---
title: LAN Device Discovery
type: techniques
created: 2015-03-16
last_updated: 2015-03-16
related: ["[[Network Port Numbers]]", "[[HTTP Protocol Analysis]]"]
sources: ["7675a3df5e91"]
---

# LAN Device Discovery

In March 2015, the subject implemented a LAN scanner in Go inspired by the mobile app Fing. The tool discovers devices on the local network, resolves their MAC addresses, and identifies the hardware vendor.

## Enumerating Local IPs

The first step is to determine the local subnet. The subject used Go's `net.Interfaces()` to find the active non-loopback network interface and extract its IPv4 address and MAC address. Once the local IP is known (for example, `192.168.1.x`), the tool can iterate over the final octet range (`1–254`) to probe every host on the subnet.

## Ping and ARP Resolution

For each candidate IP, the tool sends an ICMP ping to test reachability. For hosts that respond, the MAC address is obtained via the ARP protocol. The subject used the open-source Go package `github.com/j-keck/arping` to perform ARP lookups:

```go
dstIP := net.ParseIP(ip)
mac, duration, err := arping.Ping(dstIP)
```

ARP operates at the data-link layer and maps IP addresses to MAC addresses on the local network segment.

## Vendor Identification

The first three bytes of a MAC address constitute the Organizationally Unique Identifier (OUI), assigned by IEEE to hardware manufacturers. The subject queried IEEE's public OUI database via an HTTP POST to `http://standards.ieee.org/cgi-bin/ouisearch`, passing the OUI as form data. The response HTML was parsed to extract the vendor name.

This approach demonstrates how layer-2 addressing (MAC) can be correlated with manufacturer metadata through a public registry.
