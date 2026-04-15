---
title: DirectX Programming
type: techniques
created: 2011-01-09
last_updated: 2011-01-09
related: ["[[Game Programming Fundamentals]]", "[[Windows Concurrency]]"]
sources: ["2d7154bb2b32"]
---

# DirectX Programming

## COM Architecture

DirectX is built on the Component Object Model (COM). Applications interact with COM objects exclusively through interface pointers, never directly. This design provides three guarantees: COM interfaces are immutable, language-independent, and accessible only through methods rather than direct data access.

## Rendering Pipeline

The Direct3D rendering pipeline transforms 3D geometry into a 2D screen image through a fixed sequence of stages:

1. **Local coordinate system** — model geometry is defined relative to its own origin.
2. **World transform** — models are placed, oriented, and scaled in the shared world space.
3. **View transform** — the camera is moved to the origin and aligned with the positive z-axis; all geometry follows the same transform.
4. **Back-face culling** — polygons facing away from the camera are discarded.
5. **Lighting** — light sources, defined in world space and transformed to view space, illuminate surfaces.
6. **Clipping** — geometry outside the view frustum is removed.
7. **Projection** — 3D coordinates are mapped to a 2D projection window.
8. **Viewport transform** — the projected image is mapped to a rectangular screen region.
9. **Rasterization** — triangle pixels are shaded to produce the final 2D image.

## Core Concepts

- **Primitives** — all complex shapes are composed of triangles.
- **Flexible Vertex Format (FVF)** — programmers define vertex structures; the FVF flag must match the struct layout exactly.
- **Index buffers** — reuse vertices by referencing them through indices, reducing memory overhead.
- **Z-buffer** — depth buffering resolves object occlusion.
- **Alpha blending and alpha testing** — alpha blending combines source and destination colors using the alpha channel for transparency. Alpha testing is a binary mask: pixels either pass or fail a threshold comparison, making it faster than blending because it avoids color-buffer reads and mixing.
- **Texture addressing** — controls behavior when texture coordinates fall outside [0,1]: wrap, border, mirror, and clamp modes.
