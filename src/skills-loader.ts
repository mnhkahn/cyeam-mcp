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
      const cleaned = line.replace(/\s+/g, " ");
      const urlMatch = cleaned.match(/^(curl\s+(?:-[a-zA-Z]+\s+)*)"?([^"\s]+)/);
      if (urlMatch) {
        const prefix = urlMatch[1] || "curl ";
        let url = urlMatch[2];
        const urlObj = URL.canParse(url) ? new URL(url) : null;
        if (urlObj) {
          const base = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
          whitelist.push(`${prefix.trim()} ${base}`);
        } else if (url.includes("/")) {
          const hostPath = url.split("?")[0];
          const slashIdx = hostPath.indexOf("/");
          const baseUrl = slashIdx === -1 ? hostPath : hostPath.slice(0, slashIdx + 1);
          whitelist.push(`${prefix.trim()} ${baseUrl}`);
        }
      }
    }
  }
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
  if (/[;|&$`\n]/.test(cleaned)) return false;
  return whitelist.some((rule) => cleaned.startsWith(rule));
}
