---
title: OpenClaw
type: projects
created: 2026-03-30
last_updated: 2026-03-31
related: ["[[Model Context Protocol]]", "[[LangSmith]]", "[[Claude Code]]", "[[GeekNews]]"]
sources: ["b4d50bdfdbbf", "8292ac275c5e"]
---

# OpenClaw

OpenClaw is an open-source AI agent framework that the subject deployed and configured for personal automation. It supports multiple LLM providers, channel adapters (such as Feishu), and a skill system for extending agent capabilities.

## Deployment

The subject deployed OpenClaw on [fly.io](https://fly.io) using a Docker-based build defined in `fly.toml`. The deployment stack includes:

- **Build phase** — a Dockerfile installs the OpenClaw CLI, system dependencies, Chinese fonts, and skill dependencies.
- **Environment variables** — configure paths and runtime parameters. Key variables include:
  - `OPENCLAW_HOME = "/data"`
  - `OPENCLAW_STATE_DIR = "/data/.openclaw"`
  - `OPENCLAW_CONFIG_PATH = "/data/.openclaw/openclaw.json"`
- **Mounts** — a persistent disk at `/data` preserves state across deployments.
- **Processes** — a `start-services.sh` script launches the gateway and runtime.

## Workspace Directory Structure

OpenClaw stores configuration and state under `$OPENCLAW_STATE_DIR`:

```
/data/.openclaw/
├── openclaw.json           # Main configuration
├── exec-approvals.json     # Execution approval rules
├── workspace/              # User-defined context
│   ├── SOUL.md             # Personality settings
│   ├── USER.md             # User profile
│   ├── MEMORY.md           # Long-term memory
│   ├── IDENTITY.md         # Agent identity
│   ├── AGENTS.md           # Multi-agent routing
│   ├── BOOT.md             # Boot prompt
│   ├── HEARTBEAT.md        # Daily checklist
│   └── skills/             # Installed skills
├── agents/<cid>/           # Per-agent state
├── memory/<cid>.sqlite     # Vector memory store
├── skills/                 # Global skill packages
└── secrets.json            # Encrypted credentials
```

## Architecture

OpenClaw processes messages through a four-layer execution chain:

1. **L1 — `runReplyAgent`** — handles queue policies, steer checks, and result post-processing.
2. **L2 — `runAgentTurnWithFallback`** — wraps model calls with retry, context compression, and fallback-model switching.
3. **L3 — `runEmbeddedPiAgent`** — manages execution lanes and parses auth profiles.
4. **L4 — `runEmbeddedAttempt`** — prepares the workspace, tool set, and session, then calls the LLM.

The full message flow is:

```
User → Channel Adapter → Gateway → Command Queue → Agent Runtime (L1-L4)
→ LLM prompt assembly → Model inference → Tool/Skill execution (if needed)
→ Result re-injected into LLM → Final reply → Gateway → Channel → User
```

Sessions are persisted as JSONL files at `agents/<agent_id>/sessions/<run_id>.jsonl`.

## Model Selection

Models are configured hierarchically:

- Request-level model (dynamic override)
- Per-agent `model.fallbacks`
- Global `agents.defaults.model.fallbacks`
- Global `agents.defaults.model.primary`
- Global `agents.defaults.models` acts as a whitelist

If a provider-level failure occurs, OpenClaw retries within the same provider before switching to the next model.

## Heartbeat

Heartbeat is a periodic autonomous check. It reads `HEARTBEAT.md` from the workspace, evaluates whether any action is needed, and can send the result to a configured channel (for example, Feishu).

Configuration example:

```json
{
  "heartbeat": {
    "every": "120m",
    "model": "openrouter/minimax/minimax-m2.5:free",
    "ackMaxChars": 0,
    "target": "feishu",
    "to": "${FEISHU_CHAT_ID}"
  }
}
```

Heartbeat can be triggered manually:

```bash
openclaw system event --text "手动触发心跳" --mode now
openclaw system heartbeat last
```

Common skip reasons include `disabled`, `quiet-hours`, `requests-in-flight`, `empty-heartbeat-file`, and `duplicate`.

## Skills

Skills are folders containing a `SKILL.md` file (YAML frontmatter + Markdown instructions) plus optional `scripts/` and `references/`. They can be installed from the ClawHub marketplace or defined locally. OpenClaw loads only the name and description at startup; the full skill content is injected into context only when the agent decides it is relevant.

## Security and Approvals

OpenClaw supports three security modes for command execution:

- **deny** — block all commands by default.
- **allowlist** — allow only commands on an explicit list.
- **full** — allow all commands.

The `ask` policy controls when the agent requests explicit approval:

- **off** — never ask; rely on the security mode.
- **on-miss** — ask only when a command is not on the allowlist.
- **always** — ask before every command.

The `askFallback` setting determines behavior when an approval request times out (`deny`, `allowlist`, or `full`).

## Common Commands

```bash
openclaw --version
openclaw logs -follow
openclaw pairing list
openclaw gateway restart
openclaw channels list
openclaw cron list --all
openclaw config set agents.sandbox.mode all
openclaw approvals get
```
