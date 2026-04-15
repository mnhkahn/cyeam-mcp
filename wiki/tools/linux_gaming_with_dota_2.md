---
title: Linux Gaming with Dota 2
type: tools
created: 2014-01-11
last_updated: 2014-01-11
related: ["[[Game Programming Fundamentals]]", "[[DirectX Programming]]"]
sources: ["bb32535829b5"]
---

# Linux Gaming with Dota 2

## The Optimus Problem

In January 2014, the subject documented the process of running Dota 2 on Linux Mint 64-bit with NVIDIA Optimus dual-GPU hardware. Unlike Windows and macOS, NVIDIA did not provide automatic GPU switching on Linux at that time. The solution required third-party tools.

## Setup Steps

1. **Bumblebee** — a third-party project that enabled GPU switching on Linux by replacing NVIDIA's Optimus implementation. This required removing any existing NVIDIA proprietary drivers.
2. **VirtualGL** — installed to test 3D acceleration. On 64-bit systems, the 64-bit `glxspheres64` binary was used.
3. **32-bit Primus** — Steam for Linux was a 32-bit application, so the 32-bit Primus library (`primus-libs-ia32:i386`) had to be installed. Without it, Dota 2 failed with the error: `You appear to have OpenGL 1.4.0, but we need at least 2.0.0!`
4. **Launch parameters** — the final command combined GPU offloading with region and language settings:
   ```
   primusrun %command% +dota_full_ui 1 -perfectworld -language schinese -perfectworld steam
   ```

## Verification

GPU status was checked with `lspci | grep VGA`. The `rev` field indicated whether the NVIDIA card was active (`ff` meant inactive). The subject also used fan noise and heat as practical indicators of discrete GPU activation.
