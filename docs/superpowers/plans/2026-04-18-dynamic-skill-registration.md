# Dynamic Skill Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-scan `skills/` directory and dynamically register each skill as both an MCP prompt and an executable MCP tool with command whitelist validation.

**Architecture:** Add a `skills-loader.ts` module that scans, parses, and holds an in-memory registry of skills. Modify `server.ts` to append dynamic prompts and tools from this registry into existing MCP handlers. Command execution uses `child_process.exec` with a simple prefix-based whitelist extracted from SKILL.md bash blocks.

**Tech Stack:** TypeScript, Node.js 20+, `@modelcontextprotocol/sdk`, `child_process`, `fs`

---

## File Structure

| File | Action | Responsibility |
|------|--------|--------------|
| `src/skills-loader.ts` | Create | Scan `skills/`, parse `_meta.json` + `SKILL.md`, extract whitelist, expose `LoadedSkill[]` |
| `src/server.ts` | Modify | Import registry, append dynamic prompts/tools to `ListPrompts`/`ListTools`, handle `GetPrompt`/`CallTool` for skills |
| `skills/test-1.0.0/_meta.json` | Create | Test skill metadata |
| `skills/test-1.0.0/SKILL.md` | Create | Test skill markdown with bash blocks for whitelist testing |

---

### Task 1: Create `src/skills-loader.ts`

**Files:**
- Create: `src/skills-loader.ts`

- [ ] **Step 1: Define `LoadedSkill` interface and scan function**

```typescript
import fs from "fs";
import path from "path";

export interface LoadedSkill {
  slug: string;
  name: string;
  description: string;
  markdown: string;
  whitelist: string[];
  metadata?: Record<string, any>;
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, any>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw.trim() };
  const lines = match[1].split("\n");
  const frontmatter: Record<string, any> = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    frontmatter[key] = val;
  }
  return { frontmatter, body: match[2].trim() };
}

function extractWhitelist(markdown: string): string[] {
  const whitelist: string[] = [];
  const codeBlockRegex = /```bash\n([\s\S]*?)\n```/g;
  let m: RegExpExecArray | null;
  while ((m = codeBlockRegex.exec(markdown)) !== null) {
    const block = m[1];
    for (let line of block.split("\n")) {
      line = line.trim();
      if (!line || line.startsWith("#")) continue;
      // Extract prefix up to first argument placeholder
      // curl -s "wttr.in/London?format=3"  → curl wttr.in/
      // curl -s "https://api.open-meteo.com/v1/forecast?..." → curl https://api.open-meteo.com/v1/forecast
      const cleaned = line.replace(/\s+/g, " ");
      const urlMatch = cleaned.match(/^(curl\s+(?:-[a-zA-Z]+\s+)*)"?([^"\s]+)/);
      if (urlMatch) {
        const prefix = urlMatch[1] || "curl ";
        let url = urlMatch[2];
        // Strip query params and trailing path after domain
        const urlObj = URL.canParse(url) ? new URL(url) : null;
        if (urlObj) {
          const base = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
          whitelist.push(`${prefix.trim()} ${base}`);
        } else if (url.includes("/")) {
          // wttr.in/London?format=3 -> wttr.in/
          const hostPath = url.split("?")[0];
          const slashIdx = hostPath.indexOf("/");
          const baseUrl = slashIdx === -1 ? hostPath : hostPath.slice(0, slashIdx + 1);
          whitelist.push(`${prefix.trim()} ${baseUrl}`);
        }
      }
    }
  }
  // Deduplicate
  return [...new Set(whitelist)];
}

export function loadSkills(skillsDir = path.resolve(process.cwd(), "skills")): LoadedSkill[] {
  if (!fs.existsSync(skillsDir)) return [];
  const skills: LoadedSkill[] = [];
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const match = entry.name.match(/^(.+)-(\d+\.\d+\.\d+)$/);
    if (!match) continue;
    const slug = match[1];
    const dirPath = path.join(skillsDir, entry.name);
    const metaPath = path.join(dirPath, "_meta.json");
    const skillPath = path.join(dirPath, "SKILL.md");
    if (!fs.existsSync(metaPath) || !fs.existsSync(skillPath)) {
      console.warn(`[skills-loader] Skipping ${entry.name}: missing _meta.json or SKILL.md`);
      continue;
    }
    let meta: any;
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch {
      console.warn(`[skills-loader] Skipping ${entry.name}: invalid _meta.json`);
      continue;
    }
    const rawMarkdown = fs.readFileSync(skillPath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(rawMarkdown);
    const whitelist = extractWhitelist(rawMarkdown);
    skills.push({
      slug: meta.slug || slug,
      name: frontmatter.name || meta.slug || slug,
      description: frontmatter.description || "",
      markdown: rawMarkdown,
      whitelist,
      metadata: frontmatter.metadata ? JSON.parse(frontmatter.metadata) : undefined,
    });
  }
  return skills;
}

export function isWhitelisted(command: string, whitelist: string[]): boolean {
  const cleaned = command.trim().replace(/\s+/g, " ");
  // Block dangerous characters
  if (/[;|&$`\n]/.test(cleaned)) return false;
  return whitelist.some((rule) => cleaned.startsWith(rule));
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit src/skills-loader.ts`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/skills-loader.ts
git commit -m "feat: add skills-loader module for scanning and parsing skills"
```

---

### Task 2: Wire dynamic prompts and tools into `server.ts`

**Files:**
- Modify: `src/server.ts`

- [ ] **Step 1: Import loader at top of `server.ts`**

Add after existing imports:
```typescript
import { loadSkills, isWhitelisted, LoadedSkill } from "./skills-loader.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
```

- [ ] **Step 2: Load skills in `createServer()`**

Inside `createServer()`, before request handlers:
```typescript
function createServer() {
  const skills = loadSkills();
  const skillMap = new Map<string, LoadedSkill>(skills.map((s) => [s.slug, s]));

  // ... existing Server instantiation ...
```

- [ ] **Step 3: Append dynamic tools in `ListToolsRequestSchema`**

In the `ListToolsRequestSchema` handler, after the static tools array, append dynamic tools:
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const dynamicTools = skills.map((skill) => ({
    name: `skill_${skill.slug}_exec`,
    description:
      skill.whitelist.length > 0
        ? `Execute ${skill.name} commands. Allowed: ${skill.whitelist.join(", ")}`
        : `Execute ${skill.name} commands. (No whitelisted commands found)`,
    inputSchema: {
      type: "object" as const,
      properties: {
        command: {
          type: "string" as const,
          description: "Shell command to execute. Must match the skill whitelist.",
        },
      },
      required: ["command"],
    },
  }));

  return {
    tools: [
      // ... existing static tools ...
      ...dynamicTools,
    ],
  };
});
```

- [ ] **Step 4: Handle dynamic tool calls in `CallToolRequestSchema`**

In the `CallToolRequestSchema` handler, before the final `throw new Error`, add:
```typescript
if (name.startsWith("skill_") && name.endsWith("_exec")) {
  const slug = name.slice(6, -5); // Remove "skill_" prefix and "_exec" suffix
  const skill = skillMap.get(slug);
  if (!skill) {
    throw new Error(`Unknown skill: ${slug}`);
  }
  const command = String((args as any).command || "");
  if (!command) {
    throw new Error("Missing required argument 'command'");
  }
  if (!isWhitelisted(command, skill.whitelist)) {
    return {
      content: [
        {
          type: "text",
          text: `Error: Command not allowed by skill whitelist.\nAllowed prefixes: ${skill.whitelist.join(", ") || "none"}`,
        },
      ],
      isError: true,
    };
  }
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });
    return {
      content: [
        { type: "text", text: stdout || "(no stdout)" },
        ...(stderr ? [{ type: "text" as const, text: `stderr: ${stderr}` }] : []),
      ],
    };
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `Command failed (exit ${err.code || "unknown"}):\n${err.stdout || ""}\n${err.stderr || ""}`,
        },
      ],
      isError: true,
    };
  }
}
```

- [ ] **Step 5: Append dynamic prompts in `ListPromptsRequestSchema`**

In the `ListPromptsRequestSchema` handler, after static prompts:
```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  const dynamicPrompts = skills.map((skill) => ({
    name: `skill_${skill.slug}`,
    description: `${skill.name} — ${skill.description || "Skill prompt"}`,
  }));

  return {
    prompts: [
      // ... existing static prompts ...
      ...dynamicPrompts,
    ],
  };
});
```

- [ ] **Step 6: Handle dynamic prompt retrieval in `GetPromptRequestSchema`**

In the `GetPromptRequestSchema` handler, before the final `throw new Error`, add:
```typescript
if (name.startsWith("skill_")) {
  const slug = name.slice(6); // Remove "skill_" prefix
  const skill = skillMap.get(slug);
  if (!skill) {
    throw new Error(`Unknown skill prompt: ${slug}`);
  }
  return {
    description: `${skill.name} skill prompt`,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: skill.markdown,
        },
      },
    ],
  };
}
```

- [ ] **Step 7: Verify compilation**

Run: `npm run build`
Expected: `dist/skills-loader.js` and updated `dist/server.js` generated without errors.

- [ ] **Step 8: Commit**

```bash
git add src/server.ts
git commit -m "feat: wire dynamic skill prompts and tools into MCP server"
```

---

### Task 3: Create a test skill for manual verification

**Files:**
- Create: `skills/test-1.0.0/_meta.json`
- Create: `skills/test-1.0.0/SKILL.md`

- [ ] **Step 1: Create test skill metadata**

`skills/test-1.0.0/_meta.json`:
```json
{
  "ownerId": "test",
  "slug": "test",
  "version": "1.0.0",
  "publishedAt": 0
}
```

- [ ] **Step 2: Create test skill markdown with bash blocks**

`skills/test-1.0.0/SKILL.md`:
```markdown
---
name: test
description: A test skill for verifying dynamic registration.
---

# Test Skill

This skill is used to verify the dynamic skill registration platform.

## Commands

Get current date:
```bash
date
```

Echo a message:
```bash
echo "hello from test skill"
```
```

- [ ] **Step 3: Verify loader picks it up**

Run a quick inline test:
```bash
node -e "
const { loadSkills } = require('./dist/skills-loader.js');
const skills = loadSkills();
const test = skills.find(s => s.slug === 'test');
console.log('Found:', !!test);
console.log('Whitelist:', test?.whitelist);
"
```
Expected output shows `Found: true` and a whitelist containing `date` and `echo "hello from test skill"`.

- [ ] **Step 4: Commit**

```bash
git add skills/test-1.0.0/
git commit -m "test: add test skill for dynamic registration verification"
```

---

### Task 4: Integration test — start server and verify via MCP

**Files:**
- None (manual test against running server)

- [ ] **Step 1: Build and start the server**

```bash
npm run build
npm start
```

- [ ] **Step 2: In another terminal, send ListTools request**

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
Expected: Response includes `skill_weather_exec` and `skill_test_exec`.

- [ ] **Step 3: Send ListPrompts request**

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"prompts/list"}'
```
Expected: Response includes `skill_weather` and `skill_test`.

- [ ] **Step 4: Call the test skill tool with a whitelisted command**

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"skill_test_exec","arguments":{"command":"echo hello"}}}'
```
Expected: Response contains `"hello"` in stdout.

- [ ] **Step 5: Call the test skill tool with a blocked command**

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"skill_test_exec","arguments":{"command":"echo hello; rm -rf /"}}}'
```
Expected: Response contains `"Command not allowed by skill whitelist"`.

- [ ] **Step 6: Stop server**

Kill the `npm start` process (`Ctrl+C`).

- [ ] **Step 7: Commit (if any test fixes were needed)**

If no fixes needed, skip. If fixes were made, commit them.

---

## Spec Coverage Check

| Spec Requirement | Plan Task |
|------------------|-----------|
| Auto-scan `skills/` directory | Task 1 |
| Parse `_meta.json` and `SKILL.md` | Task 1 |
| Extract bash blocks for whitelist | Task 1 |
| Register each skill as prompt | Task 2, Steps 5-6 |
| Register each skill as tool | Task 2, Steps 3-4 |
| Command whitelist validation | Task 1 (`isWhitelisted`) + Task 2, Step 4 |
| Dangerous character blocking | Task 1 (`isWhitelisted`) |
| Timeout and error handling | Task 2, Step 4 |
| Zero code changes for new skills | Achieved — drop folder, restart server |
| Error handling for malformed skills | Task 1 (`loadSkills` try/catch + console.warn) |

## Placeholder Scan

- No "TBD", "TODO", "implement later" found.
- No vague "add error handling" without code.
- All steps include exact code snippets and commands.

## Type Consistency

- `LoadedSkill` interface used consistently in Task 1 and Task 2.
- `loadSkills()` return type matches usage in `createServer()`.
- `isWhitelisted()` signature matches usage in `CallToolRequestSchema`.
