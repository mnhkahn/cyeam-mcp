---
title: Mermaid
type: tools
created: 2026-03-10
last_updated: 2026-03-10
related: ["[[Markdown Cheatsheet]]", "[[Development Tools]]"]
sources: ["4daac3fef40f"]
---

# Mermaid

In March 2026, the subject compiled a reference for Mermaid, a JavaScript-based diagramming tool that renders charts from text descriptions embedded in Markdown.

## Flowchart

Flowcharts are declared with `flowchart` (or `graph`) followed by a direction:

- `TD` / `TB` — top down
- `LR` — left to right
- `BT` — bottom to top
- `RL` — right to left

Node shapes are controlled by brackets:

- `[text]` — rectangle
- `(text)` — rounded rectangle
- `{text}` — diamond
- `((text))` — circle

Arrows:

- `->` — solid arrow
- `-->` — dashed arrow
- `==>` — thick arrow
- `-.->` — dotted arrow
- `|label|` — arrow label

## Sequence Diagram

Declared with `sequenceDiagram`. Participants are introduced with `participant` or `actor`, and messages use arrows such as `->>`, `-->>`, and `--x`.

Control blocks include `loop`, `alt`/`else`, `opt`, and `par`.

## Gantt Chart

Declared with `gantt`. Requires `dateFormat` and `title`. Tasks are grouped under `section` headers and can be marked `done`, `active`, or `crit`.

## Other Diagram Types

- **Pie chart** — declared with `pie` and a title; data lines are `"label" : value`.
- **Class diagram** — declared with `classDiagram`; supports access modifiers (`+`, `-`, `#`) and relationships (`--|>`, `*--`, `o--`, `..>`).
- **State diagram** — declared with `stateDiagram-v2`; uses `[*]` for start/end states and `-->` for transitions.

## General Tips

- Identifiers should be unique; use simple ASCII names to avoid parsing issues.
- Comments begin with `%%`.
- Subgraphs in flowcharts can specify their own direction independently.
