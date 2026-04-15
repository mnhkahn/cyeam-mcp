---
title: AI Agent Standards
type: techniques
created: 2026-04-02
last_updated: 2026-04-02
related: ["[[Claude Code]]", "[[OpenClaw]]", "[[Model Context Protocol]]"]
sources: ["c0e9cf84b2a0"]
---

# AI Agent Standards

In April 2026, the subject surveyed emerging file-format standards designed to give AI coding agents structured, project-specific instructions and reusable skills.

## AGENTS.md

AGENTS.md is a lightweight, open format for directing coding agents. It acts as a companion to README.md: README is written for human contributors, while AGENTS.md contains information targeted at AI agents, such as build steps, test commands, and development conventions.

### Typical Sections

- Project overview
- Build and test commands
- Code style guidelines
- Testing instructions
- Security considerations
- Configuration notes

### Placement

AGENTS.md is placed at the project root (or initialized with `/init` in compatible tools). As of early 2026, more than 24 agents and tools recognize the format, including Claude Code and Trae. `CLAUDE.md` serves a similar purpose in the Anthropic ecosystem.

## SKILL.md

SKILL.md is an open format for packaging reusable agent capabilities. A skill is a folder containing at least a `SKILL.md` file with YAML frontmatter (name and description) and Markdown instructions. Optional subfolders include `scripts/`, `references/`, and `assets/`.

### Lifecycle

1. **Discovery** — the agent loads only the name and description of each available skill.
2. **Activation** — when a task matches a skill's description, the full `SKILL.md` is injected into the agent's context.
3. **Execution** — the agent follows the instructions and may run bundled scripts or read reference files.

### Installation Locations

| Scope | Path |
|---|---|
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` |
| Project | `.claude/skills/<skill-name>/SKILL.md` |
| Plugin | `<plugin>/skills/<skill-name>/SKILL.md` |

### Ecosystem Compatibility

The core file format (YAML frontmatter + Markdown) is shared across Claude Code Skills, OpenClaw AgentSkills, and Vercel Skills. Migration between ecosystems is mostly a matter of adjusting directory paths and ensuring the frontmatter includes `name` and `description` (required by OpenClaw).

## npx skills

Vercel distributes a CLI tool, `npx skills`, for managing SKILL.md packages:

```bash
npx skills add <repo>      # Install a skill
npx skills list            # List installed skills
npx skills init            # Create a new SKILL.md scaffold
npx skills find react      # Search the skill directory
npx skills remove <skill>  # Uninstall a skill
npx skills update <skill>  # Update a skill
```
