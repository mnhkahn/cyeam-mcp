---
title: Shadowsocks
type: tools
created: 2014-07-18
last_updated: 2014-07-18
related: ["[[Android Device Rooting]]", "[[Linux Shell Commands]]"]
sources: ["c14891353870"]
---

# Shadowsocks

In July 2014, the subject switched from GoAgent to Shadowsocks for circumventing internet censorship after GoAgent became unreliable.

## Architecture

Unlike GoAgent, which routed traffic through Google App Engine, Shadowsocks relies on volunteers running proxy servers abroad. Because the server IPs are widely distributed, IP-based blocking is less effective. The client connects to a local port and forwards traffic to the remote Shadowsocks server over an encrypted SOCKS5 tunnel.

## Client Installation on Linux Mint

The subject chose the Python client after finding the Go client link broken and preferring to avoid Node.js. The required dependency was installed first:

```bash
sudo apt-get install python-m2crypto
```

Then the client was installed via pip:

```bash
pip install shadowsocks
```

## Configuration

A configuration file was created at `/etc/shadowsocks/config.json`:

```json
{
    "server": "remote-shadowsocks-server-ip-addr",
    "server_port": 8883,
    "local_address": "127.0.0.1",
    "local_port": 8883,
    "password": "whosyourdaddy",
    "timeout": 300,
    "method": "aes-256-cfb",
    "fast_open": false,
    "workers": 1
}
```

Free accounts were available from a Chinese Shadowsocks community site.

## Usage

The client was started with:

```bash
sslocal -c /etc/shadowsocks/config.json
```

The Chrome extension Proxy SwitchySharp was configured to use SOCKS5 on `localhost:8883`.

## Mobile

The subject also installed Shadowsocks clients on Android and iOS. The iOS version functioned as a dedicated browser. On the Nexus 7, the Android client appeared to require root access to start.
