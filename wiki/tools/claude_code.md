---
title: Claude Code
type: tools
created: 2026-04-05
last_updated: 2026-04-05
related: ["[[AI Assisted Development]]", "[[LangSmith]]", "[[OpenClaw]]", "[[AI Agent Standards]]"]
sources: ["392443f162f1"]
---

# Claude Code

Claude Code is Anthropic's terminal-based AI coding assistant. In April 2026, the subject documented installation methods, model-routing setups, and daily-use shortcuts.

## Installation

The official installer is fetched via curl:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

## Using OpenRouter

Claude Code can be pointed at an OpenRouter endpoint instead of Anthropic's native API:

```bash
export OPENROUTER_API_KEY="<your-key>"
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export ANTHROPIC_AUTH_TOKEN="$OPENROUTER_API_KEY"
export ANTHROPIC_API_KEY=""
```

After sourcing the profile, launch with `claude` in a project directory. If configured correctly, it will not prompt for login.

## Using a Local Router (Huang Da Shan Ren)

The subject also routed Claude Code through `claude-code-router` (`@musistudio/claude-code-router`) to proxy a third-party model:

1. Obtain an API key from the provider.
2. Install the router: `npm install -g @musistudio/claude-code-router`
3. Configure via `ccr ui`.
4. Launch with `ccr code`.

## LangSmith Integration

Plugins can be added from the marketplace:

```bash
/plugin marketplace add langchain-ai/langsmith-claude-code-plugins
/plugin install langsmith-tracing@langchain-ai/langsmith-claude-code-plugins
/reload-plugins
```

Trace settings are stored in `.claude/settings.local.json`:

```json
{
  "env": {
    "TRACE_TO_LANGSMITH": "true",
    "CC_LANGSMITH_API_KEY": "<key>",
    "CC_LANGSMITH_PROJECT": "my-project"
  }
}
```

## Model Selection

| Model | Alias | Role | Best For |
|---|---|---|---|
| Claude 3.5/4.5 Sonnet | Sonnet | Daily driver | General coding, complex requirements, refactoring |
| Claude 3.5/4.5 Opus | Opus | Deep reasoning | Architecture design, hard algorithms, large refactors |
| Claude 3.5/4.5 Haiku | Haiku | Fast assistant | Simple boilerplate, summaries, light automation |

## Agent Teams

Claude Code supports delegating complex projects to multiple sub-agents with defined roles (research, design, implementation, testing). The subject used prompts such as:

> "I need to build an Android app with feature X. Create an agent team: one for research, one for interaction design, one for native Android development, and one for testing. Ensure the workflow respects dependencies between roles."

## Notification Sounds

The subject configured audio cues for long-running tasks by editing `~/.claude/settings.json`:

- **Notification** — plays `Glass.aiff` when user action is required.
- **Stop** — plays `Ping.aiff` when a task finishes.

## Common Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+C | Cancel current generation |
| Ctrl+D | Exit Claude Code |
| Ctrl+L | Clear terminal screen |
| Esc + Esc | Rewind to previous checkpoint (undo) |
| Shift+Tab | Cycle permission modes (default/plan/yolo) |
| Ctrl+G | Open input in external editor |
| Ctrl+O | Toggle verbose output |
| Ctrl+T | Toggle task list |
| Ctrl+F (×2) | Kill all background agents |
