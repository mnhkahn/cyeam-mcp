---
title: Host File Management
type: tools
created: 2018-10-26
last_updated: 2018-10-26
related: ["[[Linux Network Troubleshooting]]", "[[DNS Protocol]]"]
sources: ["7b1317153af0"]
---

# Host File Management

In October 2018, the subject documented a workflow for quickly switching between host file configurations on macOS and verifying that the changes took effect in Chrome.

## Switching Hosts on macOS

While `/etc/hosts` can be edited directly, the subject preferred using [Gas Mask](https://github.com/2ndalpha/gasmask), a macOS application that manages multiple host file groups and switches between them instantly.

## Verifying the Active Host

To confirm which host resolution is being used for a given request, the Chrome DevTools Network panel shows the resolved IP address for each request.

For a more convenient view, the subject recommended the Chrome extension [Which host](https://chrome.google.com/webstore/detail/which-host/hjecimglpgbbajfigibmieancoegaema), which displays the resolved host directly in the browser toolbar.

## Flushing Persistent Connections

Chrome maintains open HTTP connections even after the host file changes, so subsequent requests may still route to the old IP address. The built-in `chrome://net-internals/#sockets` page can close idle sockets and flush socket pools.

For a one-click solution, the [Flush DNS & close sockets](https://chrome.google.com/webstore/detail/flush-dns-close-sockets/mlmlfmdmhdplgecgmiihhfjodokajeel) extension automates this, but it requires starting Chrome with the `--enable-net-benchmarking` flag. On macOS this can be achieved by wrapping the Chrome binary with a small shell script.
