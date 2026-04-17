import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { instance } from "@viz-js/viz";

const WIKI_DIR = path.resolve(process.cwd(), "wiki");
const STATIC_DIR = path.resolve(process.cwd(), "static");

function readFile(p: string): string {
  if (!fs.existsSync(p)) return "";
  return fs.readFileSync(p, "utf-8");
}

export interface IndexEntry {
  title: string;
  description: string;
  aliases: string[];
  path: string;
}

export function parseIndex(): Record<string, IndexEntry> {
  const indexPath = path.join(WIKI_DIR, "_index.md");
  const text = readFile(indexPath);
  const articles: Record<string, IndexEntry> = {};

  let current: IndexEntry | null = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const m = line.match(/^-\s+\[\[(.+?)\]\]\s*[-—]\s*(.*)/);
    if (m) {
      const title = m[1].trim();
      const desc = m[2].trim();
      const pathGuess = guessArticlePath(title);
      current = {
        title,
        description: desc,
        aliases: [],
        path: pathGuess,
      };
      articles[pathGuess] = current;
      continue;
    }
    if (current && line.toLowerCase().startsWith("also:")) {
      const aliases = line
        .split(":", 2)[1]
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      current.aliases.push(...aliases);
    }
  }
  return articles;
}

function guessArticlePath(title: string): string {
  const safe = title.replace(/\s+/g, "_").replace(/\//g, "_");
  const candidates = [
    `${safe}.md`,
    `${safe.toLowerCase()}.md`,
    `${safe.replace(/_/g, "-").toLowerCase()}.md`,
  ];

  function findInDir(dir: string): string | undefined {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findInDir(full);
        if (found) return found;
      } else if (entry.isFile()) {
        for (const cand of candidates) {
          if (entry.name.toLowerCase() === cand.toLowerCase()) {
            return path.relative(WIKI_DIR, full).replace(/\.md$/i, "");
          }
        }
      }
    }
    return undefined;
  }

  if (fs.existsSync(WIKI_DIR)) {
    const found = findInDir(WIKI_DIR);
    if (found) return found;
  }
  return safe;
}

export function loadBacklinks(): Record<string, string[]> {
  const backlinksPath = path.join(WIKI_DIR, "_backlinks.json");
  const text = readFile(backlinksPath);
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function resolveArticlePath(name: string): string | null {
  const clean = name.replace(/^\[\[|\]\]$/g, "").trim();
  const tries = [
    path.join(WIKI_DIR, `${name}.md`),
    path.join(WIKI_DIR, `${clean}.md`),
  ];
  for (const p of tries) {
    if (fs.existsSync(p)) return p;
  }

  const guess = guessArticlePath(clean);
  const gpath = path.join(WIKI_DIR, `${guess}.md`);
  if (fs.existsSync(gpath)) return gpath;

  // fuzzy match
  const safe = clean.replace(/\s+/g, "_").toLowerCase();
  function findInDir(dir: string): string | undefined {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findInDir(full);
        if (found) return found;
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const stem = entry.name.slice(0, -3).toLowerCase();
        if (stem === safe || stem.replace(/_/g, " ") === clean.toLowerCase()) {
          return full;
        }
      }
    }
    return undefined;
  }
  if (fs.existsSync(WIKI_DIR)) {
    const found = findInDir(WIKI_DIR);
    if (found) return found;
  }
  return null;
}

export function extractWikilinks(content: string): string[] {
  const matches = content.match(/\[\[(.+?)\]\]/g) || [];
  return matches.map((m) => m.slice(2, -2));
}

export function extractFrontmatter(
  content: string
): { frontmatter: Record<string, unknown>; body: string } {
  if (content.startsWith("---")) {
    const parts = content.split("---");
    if (parts.length >= 3) {
      try {
        const fm = yaml.load(parts[1]) as Record<string, unknown> || {};
        return { frontmatter: fm, body: parts.slice(2).join("---").trim() };
      } catch {
        // fall through
      }
    }
  }
  return { frontmatter: {}, body: content.trim() };
}

function wordSet(text: string): Set<string> {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  return new Set(words);
}

export function matchArticles(
  question: string,
  index: Record<string, IndexEntry>
): string[] {
  const qLower = question.toLowerCase();
  const qWords = wordSet(question);
  const scores: Record<string, number> = {};

  for (const [pathKey, info] of Object.entries(index)) {
    let score = 0;
    const title = info.title || "";
    const aliases = info.aliases || [];
    const desc = info.description || "";

    if (title.toLowerCase().includes(qLower)) score += 10;
    if (qLower.includes(title.toLowerCase())) score += 8;

    for (const alias of aliases) {
      if (alias.toLowerCase().includes(qLower)) score += 8;
      if (qLower.includes(alias.toLowerCase())) score += 6;
    }

    const descWords = wordSet(desc);
    let overlap = 0;
    for (const w of qWords) if (descWords.has(w)) overlap++;
    score += overlap * 1.5;

    const titleWords = wordSet(title);
    let titleOverlap = 0;
    for (const w of qWords) if (titleWords.has(w)) titleOverlap++;
    score += titleOverlap * 2;

    if (score > 0) scores[pathKey] = score;
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => p);
}

export function wikiQuery(
  question: string,
  depth = 2,
  maxArticles = 8
): string {
  const index = parseIndex();
  const backlinks = loadBacklinks();

  // 1. match candidates
  const candidates = matchArticles(question, index);

  // 2. extend with backlinks
  const extended = new Set(candidates);
  for (const art of Array.from(extended).slice(0, maxArticles)) {
    for (const ref of backlinks[art] || []) {
      extended.add(ref);
    }
  }

  // 3. read articles
  const contents: Record<string, string> = {};
  for (const art of Array.from(extended).slice(0, maxArticles)) {
    const p = resolveArticlePath(art);
    if (p) contents[art] = readFile(p);
  }

  // 4. follow wikilinks
  for (let i = 0; i < depth; i++) {
    if (Object.keys(contents).length >= maxArticles) break;
    const newLinks = new Set<string>();
    for (const content of Object.values(contents)) {
      for (const link of extractWikilinks(content)) {
        const guess = guessArticlePath(link);
        if (!contents[guess]) newLinks.add(guess);
      }
    }
    for (const link of newLinks) {
      if (Object.keys(contents).length >= maxArticles) break;
      const p = resolveArticlePath(link);
      if (p) contents[link] = readFile(p);
    }
  }

  if (Object.keys(contents).length === 0) {
    return "知识库中未找到与问题相关的文章。";
  }

  // 5. format
  const parts = [`# Wiki 查询结果\n\n**问题**：${question}\n`];
  let i = 1;
  for (const [artPath, content] of Object.entries(contents)) {
    const { frontmatter, body } = extractFrontmatter(content);
    const title = (frontmatter.title as string) || artPath.replace(/_/g, " ");
    const snippet = body.length > 4000 ? body.slice(0, 4000) + "\n\n...（内容已截断）" : body;
    parts.push(
      `## 文章 ${i}: [[${title}]]\n\n` +
        `**路径**：\`${artPath}.md\`\n\n` +
        `${snippet}\n`
    );
    i++;
  }

  return parts.join("\n---\n");
}

export function wikiGetArticle(name: string): string {
  const p = resolveArticlePath(name);
  if (!p) return `未找到文章：${name}`;
  return readFile(p);
}

export function wikiSearchIndex(keyword: string): string {
  const index = parseIndex();
  const kwLower = keyword.toLowerCase();
  const results: string[] = [];
  for (const [, info] of Object.entries(index)) {
    const text = `${info.title} ${info.aliases.join(" ")} ${info.description}`;
    if (text.toLowerCase().includes(kwLower)) {
      results.push(`- [[${info.title}]] — ${info.description}`);
    }
  }
  if (results.length === 0) {
    return `未找到包含关键词 \`${keyword}\` 的文章。`;
  }
  return "## 搜索结果\n\n" + results.join("\n");
}

function safeDotId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, "_");
}

function listWikiMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listWikiMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_")) {
      results.push(full);
    }
  }
  return results;
}

export interface WikiGraphOptions {
  query?: string;
  depth?: number;
  maxNodes?: number;
}

async function buildWikiGraphSvg(options: WikiGraphOptions = {}): Promise<string> {
  const { query = "", depth = 1, maxNodes = 50 } = options;
  const files = listWikiMarkdownFiles(WIKI_DIR);
  const allNodes = new Map<string, { label: string; category: string }>();
  const allEdges: [string, string][] = [];

  for (const file of files) {
    const content = readFile(file);
    const relPath = path.relative(WIKI_DIR, file).replace(/\.md$/i, "");
    const { frontmatter } = extractFrontmatter(content);
    const title = (frontmatter.title as string) || relPath.replace(/_/g, " ");
    const category = relPath.split("/")[0] || "uncategorized";
    allNodes.set(relPath, { label: title, category });

    for (const link of extractWikilinks(content)) {
      const target = guessArticlePath(link);
      allEdges.push([relPath, target]);
    }
  }

  // Build adjacency for BFS
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const [from, to] of allEdges) {
    if (!outgoing.has(from)) outgoing.set(from, []);
    outgoing.get(from)!.push(to);
    if (!incoming.has(to)) incoming.set(to, []);
    incoming.get(to)!.push(from);
  }

  let selected = new Set<string>();
  if (query.trim()) {
    const qLower = query.toLowerCase();
    // Match nodes by title or path
    const seeds: string[] = [];
    for (const [id, info] of allNodes) {
      if (info.label.toLowerCase().includes(qLower) || id.toLowerCase().includes(qLower)) {
        seeds.push(id);
      }
    }
    for (const seed of seeds) selected.add(seed);
    // BFS expand
    for (let d = 0; d < depth; d++) {
      const frontier = Array.from(selected);
      for (const id of frontier) {
        for (const nxt of outgoing.get(id) || []) {
          if (allNodes.has(nxt)) selected.add(nxt);
        }
        for (const nxt of incoming.get(id) || []) {
          if (allNodes.has(nxt)) selected.add(nxt);
        }
      }
      if (selected.size >= maxNodes) break;
    }
    // Hard cap
    if (selected.size > maxNodes) {
      const arr = Array.from(selected).slice(0, maxNodes);
      selected = new Set(arr);
    }
  } else {
    selected = new Set(allNodes.keys());
  }

  const nodes = new Map<string, { label: string; category: string }>();
  for (const id of selected) {
    const info = allNodes.get(id);
    if (info) nodes.set(id, info);
  }

  const categoryColors = [
    "#e0f7fa", "#fff3e0", "#f3e5f5", "#e8f5e9", "#fce4ec", "#f1f8e9", "#e3f2fd", "#fffde7",
  ];
  const categoryColorMap = new Map<string, string>();
  let colorIdx = 0;

  const dotLines: string[] = [];
  dotLines.push("digraph Wiki {");
  dotLines.push('  rankdir="LR";');
  dotLines.push('  graph [fontname="Helvetica", fontsize=12, bgcolor="white"];');
  dotLines.push('  node [shape=box, style="rounded,filled", fontname="Helvetica", fontsize=10];');
  dotLines.push('  edge [fontname="Helvetica", fontsize=9, color="#666666"];');

  for (const [id, info] of nodes) {
    if (!categoryColorMap.has(info.category)) {
      categoryColorMap.set(info.category, categoryColors[colorIdx % categoryColors.length]);
      colorIdx++;
    }
    const safeId = safeDotId(id);
    const safeLabel = info.label.replace(/"/g, '\\"');
    const color = categoryColorMap.get(info.category)!;
    dotLines.push(`  "${safeId}" [label="${safeLabel}", fillcolor="${color}"];`);
  }

  for (const [from, to] of allEdges) {
    if (nodes.has(from) && nodes.has(to)) {
      dotLines.push(`  "${safeDotId(from)}" -> "${safeDotId(to)}";`);
    }
  }

  dotLines.push("}");

  const viz = await instance();
  const result = viz.render(dotLines.join("\n"), { format: "svg" });
  if (result.status === "failure") {
    throw new Error(result.errors.map((e: any) => e.message).join(", "));
  }
  return result.output as string;
}

export async function wikiGetGraph(
  options?: WikiGraphOptions
): Promise<
  | { mimeType: string; base64: string; path: string }
  | { error: string }
> {
  try {
    const svg = await buildWikiGraphSvg(options);
    return { mimeType: "image/svg+xml", base64: Buffer.from(svg).toString("base64"), path: "" };
  } catch (err: any) {
    // Fallback to static files
    for (const ext of ["png", "svg"]) {
      const p = path.join(STATIC_DIR, `graph.${ext}`);
      if (fs.existsSync(p)) {
        const data = fs.readFileSync(p);
        const base64 = data.toString("base64");
        const mimeType = ext === "png" ? "image/png" : "image/svg+xml";
        return { mimeType, base64, path: p };
      }
    }
    return {
      error: `知识图谱生成失败: ${err.message || String(err)}`,
    };
  }
}
