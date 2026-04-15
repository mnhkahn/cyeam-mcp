---
title: Harness Engineering
type: techniques
created: 2026-04-06
last_updated: 2026-04-06
related: ["[[Claude Code]]", "[[AI Assisted Development]]", "[[Large Language Models]]", "[[AI Agent Standards]]"]
sources: ["f12c5b9cad23"]
---

# Harness Engineering

Harness Engineering (驾驭工程) is a systems-control paradigm for building reliable AI agents. In April 2026, the subject analyzed its relationship to earlier phases of AI engineering and mapped the concrete architecture used in coding agents such as Claude Code.

## Three Phases of AI Engineering

| Dimension | Prompt Engineering | Context Engineering | Harness Engineering |
|---|---|---|---|
| Core focus | Instruction optimization | Information supply | System control |
| Analogy | Writing a script | Building a set / researching | Building a race car / holding the reins |
| Problem solved | Model misunderstands the request | Model forgets or lacks knowledge | Model is unreliable, uncontrollable, or unsafe |
| Object | Plain-text prompt | Conversation history + external knowledge (RAG) | Full agent lifecycle + external tools |
| Techniques | Role prompts, few-shot, CoT, templates | Session management, vector retrieval, window truncation | State machines, function calling, guardrails, self-healing loops |
| Complexity | Low | Medium | High |
| Interaction level | Single turn | Multi-turn memory | Autonomous execution |
| Representative products | Prompt template libraries | RAG systems, chat history managers | OpenClaw, AutoGPT, Claude Code |

## Code Harness Architecture

A Code Harness combines three layers:

- **Model layer** — the LLM or reasoning LLM that acts as the engine.
- **Agent loop** — Observe → Inspect → Choose → Act.
- **Runtime scaffolding** — context, tools, permissions, caching, memory, and sub-agents.

### 1. Live Repo Context

At startup, the agent inspects the current repository, reads Git context (branch, status, commits), and loads project documents such as `AGENTS.md`, `README.md`, and `CLAUDE.md`. These are combined into a stable prompt prefix that is reused across turns.

### 2. Prompt Shape and Cache Reuse

Instead of rebuilding the entire prompt every turn, the agent separates:

- **Stable prefix** — rules, tool definitions, workspace summary (cached).
- **Compact transcript** — recent, deduplicated conversation history.
- **Working memory** — current task, open files, notes.
- **Latest user request** — the new input.

This structure reduces token cost and improves inference stability.

### 3. Tool Access and Security

Tool permissions are checked in layers:

- General tool rules (allow / deny / ask).
- Per-tool `checkPermissions()`.
- Mode, bypass, and dangerous-rule overrides.

File-system permissions use path-based rules and working-directory boundaries. External access (WebFetch, MCP) is gated by host/path or server-level allowlists.

A low-hallucination workflow is enforced by generating, executing, verifying, diagnosing, and self-healing in a closed loop.

### 4. Context Compression

To prevent context-window overflow, the agent applies several strategies:

- **Clip** — truncate oversized search results and shell logs.
- **Deduplicate** — remove redundant file-read events.
- **Asymmetric detail** — keep recent turns in full detail and summarize older turns.
- **Compact transcript** — produce a concise, clean history before prompt assembly.

Compression can be triggered manually with `/compact` or automatically when the context nears its limit.

### 5. Delegation with Bounded Subagents

Complex tasks are decomposed and delegated to sub-agents with restricted tool sets and scoped context. Sub-agents can be invoked automatically, by natural-language mention, or via `@-mention` for guaranteed delegation.

Example configuration:

```json
{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}
```

## Memory and Persistence

Claude Code maintains several persistence layers:

- **Process-level caches** — file read caches, file-index caches, Git watcher caches (lost on exit).
- **Project-level caches** — derived data such as `exampleFiles` (recomputed when stale).
- **Session-level persistence** — full transcript stored as `~/.claude/projects/<project>/<sessionId>.jsonl`, including attribution snapshots, file-history snapshots, content replacements, and context-collapse checkpoints.
- **File-history backups** — actual old file contents kept at `~/.claude/file-history/<sessionId>/`.

Automatic memory is stored under `~/.claude/projects/<project>/memory/` as Markdown files. Claude scans the frontmatter of up to 200 memory files, sorted by modification time, and excludes `MEMORY.md` from the frontmatter scan.
