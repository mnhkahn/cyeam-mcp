---
title: AI Assisted Development
type: life
created: 2025-06-22
last_updated: 2026-03-06
related: ["[[Model Context Protocol]]", "[[OpenAI Integration]]", "[[LangSmith]]", "[[Technology Observations]]"]
sources: ["32d310f0324e", "100ccf0b5ada"]
---

# AI Assisted Development

In 2025 and early 2026, the subject documented experiences using AI coding assistants for both personal projects and professional work.

## Tools Evaluated

- **Trae** — a VS Code-based IDE with built-in AI assistance. The subject used it primarily as an editor with autocomplete and appreciated its automatic commit-message generation, but found it less reliable for large refactoring across an entire codebase.
- **Doubao** — noted for broad factual knowledge, though slightly behind DeepSeek in raw code quality.
- **DeepSeek** — considered the best coding assistant among those tested, especially for generating complete, runnable implementations from scratch.

## Strengths

The subject identified several areas where AI excelled:

- **Bootstrapping** — generating a complete first draft of a small page, script, or function from a natural-language description.
- **Breadth of knowledge** — surfacing unexpected solutions and library choices (for example, explaining Bootstrap responsive breakpoints) that would be harder to discover with traditional search.
- **Code review** — catching unused variables, potential panics, and logical errors in diffs.

## Limitations

- **Large-project context** — AI assistants struggle to maintain coherence across many files or deeply understand existing architecture.
- **Iterative refinement** — modifying an existing implementation often degraded quality. The subject found it more effective to understand the code manually, identify the precise change needed, and then ask for a fresh implementation of that isolated piece.
- **Front-end polish** — subtle UI behaviors such as conflict highlighting, auto-fill hints, and candidate-value rendering were usually implemented manually or adapted from existing examples rather than generated reliably.

## Workflow

The subject developed a two-step routine:

1. Ask a concrete, bounded question. If the answer is wrong, correct it or switch agents. Once the foundation is solid, proceed.
2. Iterate in small increments, verifying each result before asking for the next change.

## Projects

- **Sudoku game** — built with HTML, CSS, and JavaScript. The initial scaffold came from a single prompt, but ensuring a unique solution and refining the UI required manual intervention.
- **Medicine reminder app** — an Android application developed in Doubao's "expert" mode by asking step-by-step implementation questions, despite the subject having no prior Android experience.

The subject concluded that the most productive relationship with AI is one of manager and executor: the human owns architecture, debugging, and verification, while the AI handles rapid drafting and broad research.
