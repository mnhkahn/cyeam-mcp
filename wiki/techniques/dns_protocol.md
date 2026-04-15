---
title: DNS Protocol
type: techniques
created: 2015-01-29
last_updated: 2015-02-03
related: ["[[HTTP Protocol Analysis]]", "[[Network Port Numbers]]"]
sources: ["5c0910acd9a6", "b05df450c422"]
---

# DNS Protocol

The Domain Name System (DNS) is an application-layer protocol that resolves human-readable domain names into IP addresses. In early 2015, the subject analyzed DNS packet structure with Wireshark and implemented a minimal DNS client in Go.

## Transport

DNS typically runs over UDP on port 53, though TCP is also used for large responses. The subject used Alibaba's public DNS resolver (`223.5.5.5:53`) for testing.

## Packet Structure

A DNS message begins with a 12-byte header followed by questions and answers.

### Header (12 bytes)

| Field | Size | Description |
|---|---|---|
| Transaction ID | 2 bytes | Random identifier used to match requests with responses. |
| Flags | 2 bytes | Query/response indicator, recursion desired, error codes, etc. |
| Questions | 2 bytes | Number of queries in the message. |
| Answer RRs | 2 bytes | Number of resource records in the answer section. |
| Authority RRs | 2 bytes | Number of authority resource records. |
| Additional RRs | 2 bytes | Number of additional resource records. |

### Question Section

Each question contains:

- **Name** — the domain name encoded as a sequence of length-prefixed labels. For example, `www.cyeam.com` becomes `3www5cyeam3com0` (the final zero byte marks the end).
- **Type** — 2 bytes; common values are `A` (1) for IPv4 addresses and `CNAME` (5) for canonical names.
- **Class** — 2 bytes; typically `IN` (1) for the Internet class.

### Answer Section

Each answer record contains:

- **Name** — 2 bytes (often a pointer to the question name).
- **Type** — 2 bytes.
- **Class** — 2 bytes.
- **TTL** — 4 bytes; time-to-live in seconds.
- **Data length** — 2 bytes.
- **Data** — variable length. For a `CNAME` record, the data is another domain name encoded in the same label format. For an `A` record, the data is a 4-byte IPv4 address.

## Go Implementation

The subject implemented a minimal DNS client in Go using `net.DialUDP` for transport and manual binary packing/unpacking with `encoding/binary`.

### Request Encoding

The `Pack` method serializes a `DnsMsg` struct into bytes:

```go
func (this *DnsMsg) Pack() []byte {
    bs := make([]byte, 12)
    binary.BigEndian.PutUint16(bs[0:2], this.Id)
    binary.BigEndian.PutUint16(bs[2:4], this.Bits)
    binary.BigEndian.PutUint16(bs[4:6], uint16(len(this.Questions)))
    // ... Ancount, Nscount, Arcount

    ds := strings.Split(this.Questions[0].Name, ".")
    for _, d := range ds {
        bs = append(bs, byte(len(d)))
        bs = append(bs, []byte(d)...)
    }
    bs = append(bs, 0)
    // append Qtype and Qclass
    return bs
}
```

### Response Decoding

The `Unpack` method reads the 12-byte header, iterates over the question section to skip past it, and then parses each answer record. The answer type (`A` or `CNAME`) determines how the payload bytes are interpreted—either as a dotted IPv4 address or as another length-prefixed domain name.

### Usage

```go
service := "223.5.5.5:53"
udpAddr, _ := net.ResolveUDPAddr("udp", service)
conn, _ := net.DialUDP("udp", nil, udpAddr)

question := dnsQuestion{"www.cyeam.com", dnsTypeA, dnsClassINET}
out := DnsMsg{Id: 2015, Bits: _RD, Questions: []dnsQuestion{question}}
conn.Write(out.Pack())

buf := make([]byte, 512)
n, _ := conn.Read(buf)
fmt.Println(out.Unpack(buf[:n]))
```

This implementation demonstrates how to construct and parse a binary network protocol directly from Go structs without relying on higher-level resolver libraries.
