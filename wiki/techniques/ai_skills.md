---
title: AI Skills
type: techniques
created: 2026-04-15
last_updated: 2026-04-15
related: ["[[AI Agent Standards]]", "[[Claude Code]]", "[[OpenClaw]]"]
sources: ["ee97dd70ef9f"]
---

# AI Skills

In April 2026, the subject surveyed the ecosystem of reusable skill packages for AI agents, focusing on the `npx skills` CLI and the differences between Claude Code Skills, OpenClaw Skills, and Vercel Skills.

## npx skills

`npx skills` is a Vercel-open-sourced CLI for managing SKILL.md packages. It installs skills into the appropriate agent directory (for example, `.claude/skills`) and handles versioning.

### Common Commands

```bash
npx skills add <repo>           # Install a skill
npx skills list                 # List installed skills
npx skills init                 # Create a new SKILL.md scaffold
npx skills find <keyword>       # Search the skill directory
npx skills remove <author/repo> # Uninstall a skill
npx skills update <author/repo> # Update a skill
npx skills path                 # Show the skill installation path
```

## Skill Ecosystem Comparison

| Dimension | Claude Code Skills | OpenClaw Skills |
|---|---|---|
| Developer | Anthropic | OpenClaw community (open source) |
| Core file | `SKILL.md` (YAML frontmatter + Markdown) | `SKILL.md` (YAML frontmatter + Markdown) |
| Directory | `.claude/skills/` or `~/.claude/skills/` | Project workspace or `~/.openclaw/skills/` |
| Trigger | Auto-match by description or `/slash-command` | Auto-match or `/slash-command` |
| Model lock | Claude only | Model-agnostic (Claude, GPT-4, Llama, Mistral, etc.) |
| Runtime | Anthropic cloud or local terminal | Fully self-hosted |
| Security | Anthropic-managed sandbox | User-managed; requires auditing for RCE and prompt-injection risks |
| Vercel compatibility | Supported via `npx skills add` | Supported; same skill package works unmodified |

## Migration Notes

The file format is nearly identical across ecosystems, so migration cost is low. The main requirement when moving a Claude Code Skill to OpenClaw is ensuring the YAML frontmatter includes `name` and `description`; without them, OpenClaw will not load the skill.

## Notable Example: wiki-gen-skill

The subject highlighted a minimalist skill that demonstrates how much can be achieved with a well-written `SKILL.md` and shell commands rather than custom code. It exposes three slash commands:

- `/wiki ingest` — convert raw data into markdown entries using a generated Python script.
- `/wiki absorb [date-range]` — compile entries into wiki articles.
- `/wiki query <question>` — answer questions from the wiki without modifying files.

Key design insights from the skill:

- **Mechanical tasks use scripts** — ingestion is handled by a Python script rather than LLM transformation, saving tokens and improving reliability.
- **Strict process rules** — the absorb step mandates chronological processing and re-reading the index before each entry.
- **Quality guardrails** — anti-cramming (preventing oversized articles), anti-thinning (preventing empty pages), and periodic quality audits are enforced by the skill instructions.
- **Read-only query** — the query command is explicitly forbidden from reading raw entries or modifying wiki files.

## Relationship Visualization

Skills can reference one another and form a knowledge graph. The subject noted that tools such as Obsidian can visualize these relationships by scanning the markdown files, provided the correct folder (rather than the entire repository root) is opened.
