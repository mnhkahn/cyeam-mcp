# Dynamic Skill Registration Platform Design

## 1. Overview

Build a platform that auto-scans the `skills/` directory and dynamically registers each skill as both an MCP **prompt** and an MCP **tool**, without requiring any code changes when adding new skills.

A skill is a folder under `skills/` matching `*-x.x.x`, containing `_meta.json` and `SKILL.md`.

## 2. Goals

- Zero code changes when adding a new skill (drop folder → auto-register).
- Each skill exposes:
  - A **Prompt** returning the full `SKILL.md` for LLM reference.
  - A **Tool** that can execute whitelisted shell commands extracted from `SKILL.md`.
- Simple command whitelist validation (prefix matching) for safety.

## 3. Architecture

```
skills/
  <name>-<version>/
    _meta.json          → slug, version, publishedAt
    SKILL.md            → frontmatter (name, description, metadata) + markdown body

src/
  skills-loader.ts      → Scan, parse, build skills registry
  server.ts             → Integrate dynamic prompts/tools into MCP handlers
  prompts.ts            → Keep static prompts; dynamic prompts injected by loader
```

## 4. Components

### 4.1 `src/skills-loader.ts`

Responsibilities:
- Scan `skills/` for directories matching `*-x.x.x`.
- Read `_meta.json` to get `slug`.
- Read `SKILL.md`:
  - Parse frontmatter (`name`, `description`, `metadata`).
  - Extract all `bash` code blocks → generate command whitelist.
- Return an in-memory `SkillRegistry` array.

```typescript
interface LoadedSkill {
  slug: string;
  name: string;
  description: string;
  markdown: string;
  whitelist: string[];      // e.g. ["curl wttr.in/", "curl https://api.open-meteo.com/v1/forecast"]
  metadata?: Record<string, any>;
}
```

### 4.2 Dynamic Prompt Registration

In `ListPromptsRequestSchema`, append for each loaded skill:
```typescript
{
  name: `skill_${slug}`,
  description: `${name} — ${description}`
}
```

In `GetPromptRequestSchema`, when `name === skill_${slug}`:
```typescript
return {
  description: `${name} skill prompt`,
  messages: [{
    role: "user",
    content: { type: "text", text: skill.markdown }
  }]
};
```

### 4.3 Dynamic Tool Registration

In `ListToolsRequestSchema`, append for each loaded skill:
```typescript
{
  name: `skill_${slug}_exec`,
  description: `Execute ${skill.name} commands. Allowed: ${skill.whitelist.join(", ")}`,
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "Shell command to execute. Must match the skill whitelist."
      }
    },
    required: ["command"]
  }
}
```

In `CallToolRequestSchema`, when `name === skill_${slug}_exec`:
1. Find matching `LoadedSkill`.
2. Validate `command` against `whitelist` (simple prefix match).
3. Reject if command contains dangerous characters (`;`, `&&`, `||`, `|`, `` ` ``, `$`, `\n`).
4. Execute with `child_process.exec` (`timeout: 30000`, `maxBuffer: 1024 * 1024`).
5. Return `{ stdout, stderr, exitCode }`.

### 4.4 Command Whitelist Validation

Rules:
- Extract the command line from bash code blocks (first token + target host/path).
- Whitelist entry is the command prefix up to the argument placeholder.
- Example:
  - `curl -s "wttr.in/London?format=3"` → `curl wttr.in/`
  - `curl -s "https://api.open-meteo.com/v1/forecast?latitude=..."` → `curl https://api.open-meteo.com/v1/forecast`

Validation:
```typescript
function isWhitelisted(command: string, whitelist: string[]): boolean {
  const cleaned = command.trim().replace(/\s+/g, " ");
  if (/[;|&$`\n]/.test(cleaned)) return false;
  return whitelist.some(rule => cleaned.startsWith(rule));
}
```

## 5. Data Flow

```
Server Start
  └─→ loadSkills()
        ├─→ Scan skills/ directories
        ├─→ Parse _meta.json + SKILL.md
        └─→ Extract whitelist from bash blocks
              └─→ LoadedSkill[] stored in memory

MCP ListPrompts
  └─→ Concatenate static prompts + dynamic skill prompts

MCP ListTools
  └─→ Concatenate static tools + dynamic skill tools

MCP CallTool(skill_weather_exec, { command })
  ├─→ Find skill by slug
  ├─→ isWhitelisted(command, skill.whitelist)
  │     └─→ No  → Return error: "Command not allowed"
  └─→ Yes → exec(command, { timeout: 30s })
        └─→ Return { stdout, stderr, exitCode }
```

## 6. Error Handling

### 6.1 Scan Phase
| Condition | Behavior |
|-----------|----------|
| `_meta.json` missing / malformed | Skip skill, `console.warn`, continue startup |
| `SKILL.md` missing | Skip skill |
| No bash code blocks in `SKILL.md` | Register prompt, register tool with "no commands" note |
| Directory name not matching `*-x.x.x` | Ignore |

### 6.2 Execution Phase
| Condition | Behavior |
|-----------|----------|
| Command not in whitelist | Return error text, `exitCode = 1` |
| Dangerous characters detected | Reject before exec |
| Timeout (>30s) | Kill process, return timeout error |
| Non-zero exit code | Return `stdout` + `stderr`, do not throw |

## 7. Testing

- Add a test skill folder in `skills/test-1.0.0/` with known `_meta.json` and `SKILL.md`.
- Verify `ListPrompts` and `ListTools` include the dynamic entries.
- Verify whitelisted command executes and returns output.
- Verify non-whitelisted command is rejected.
- Verify dangerous characters are blocked.

## 8. Future Extensions

- Hot-reload: watch `skills/` directory for changes and reload without restart.
- Richer whitelist: support regex patterns or argument schema validation.
- Tool parameter schema from `_meta.json`: allow explicit JSON args instead of raw command strings.
