---
title: Development Tools
type: tools
created: 2024-11-16
last_updated: 2024-11-16
related: ["[[Shadowsocks]]", "[[Linux Shell Commands]]", "[[Markdown Cheatsheet]]"]
sources: ["3045d90a0fa2"]
---

# Development Tools

In March 2017, the subject compiled a list of productivity tools used for daily development and workflow automation.

## Virtualization and Shell

- **Vagrant** — a wrapper around VirtualBox that provisions lightweight Linux virtual machines. The subject used it to maintain a Unix-like development environment on Windows, with shared folders for code synchronization between the host IDE and the guest compiler.
- **SecureCRT** — an SSH terminal client. The subject highlighted its built-in `rz`/`sz` commands for file transfer without requiring a separate FTP client.

## Utilities

- **Everything** — a Windows file-search utility noted for its near-instant indexing.
- **json.cn** — a web-based JSON formatter used for quick pretty-printing.
- **FeHelper** — a Chrome extension for frontend development that formats JSON and displays array lengths.
- **Tampermonkey** — a browser userscript manager. The subject used it to build lightweight page-modification tools without writing a full Chrome extension.

## Deployment and Hosting

- **Heroku** — a PaaS provider supporting Go deployments via `git push heroku master`. The subject hosted a personal site there for small experiments.

## Network Tools

- **Proxifier** — a Windows proxy client that routes arbitrary applications through a SOCKS proxy.
- **Wingy** — an iOS utility that converts Shadowsocks into a system-wide VPN connection with automatic routing.
