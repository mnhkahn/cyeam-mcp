---
title: Cyeam MCP
type: projects
created: 2026-04-16
last_updated: 2026-04-16
related: ["[[OpenClaw]]", "[[Model Context Protocol]]", "[[Claude Code]]", "[[AI Agent Standards]]"]
sources: ["87d808e1f7c3"]
---

# Cyeam MCP

Cyeam MCP is a Model Context Protocol (MCP) server that exposes a personal knowledge wiki as queryable tools and resources for AI assistants. It implements the LLM Wiki paradigm proposed by Andrej Karpathy in 2026, in which a large language model acts as a "knowledge compiler" and "librarian" rather than a passive retrieval engine.

## Concept: LLM Wiki vs Traditional RAG

The LLM Wiki approach differs from classical retrieval-augmented generation (RAG) in several respects:

| Dimension | Traditional RAG | LLM Wiki |
|---|---|---|
| Knowledge form | Raw documents, fragmented text | Pre-compiled structured Markdown |
| Workflow | Real-time retrieval per query | Compile once, query compiled knowledge |
| Cross-references | Weak links, fragmented | Strong wikilinks, compounding growth |
| Maintenance cost | High manual effort | Automated maintenance by LLM |
| Dependencies | Vector database, embedding model | File system only |
| Traceability | Scattered retrieval chunks | Readable, editable wiki pages |

In this model, raw entries (blog posts, journal entries, notes) are first "absorbed" into thematic wiki articles by an LLM. Queries then operate on the compiled wiki rather than the raw source material.

## Architecture

The system follows a pipeline:

1. **Ingest** — source files are converted into individual Markdown entries in `raw/entries/`.
2. **Absorb** — entries are processed chronologically and woven into wiki articles under `wiki/`.
3. **Query** — natural-language questions are answered by reading the compiled wiki.
4. **Breakdown** — missing articles are identified and created to expand coverage.

Quality checkpoints run every 15 entries during absorption to prevent article bloat and ensure narrative coherence.

## MCP Protocol Design

The server exposes three MCP content categories:

### Tools (Active Functions)

| Tool | Purpose |
|---|---|
| `wiki_query` | Core retrieval: scores the index, expands backlinks, follows wikilinks up to a configurable depth, and returns 3–8 relevant article summaries |
| `wiki_get_article` | Deep read: returns the full content of a single article by name or path |
| `wiki_search_index` | Discovery: keyword search over article titles, aliases, and descriptions |
| `wiki_get_graph` | Visualization: returns a knowledge-graph image (`static/graph.png` or `static/graph.svg`) |

`wiki_query` performs four steps internally:

1. Index matching against `_index.md` titles and aliases.
2. Backlink expansion: articles that reference a matched article are included.
3. Wikilink traversal: follows `[[...]]` links up to the requested depth.
4. Truncation and assembly: articles longer than 4,000 characters are truncated before being returned.

### Resources (Passive Data)

| URI | Content |
|---|---|
| `wiki://index` | Full `_index.md` |
| `wiki://backlinks` | Full `_backlinks.json` |
| `wiki://graph` | Knowledge-graph image |
| `wiki://article/<name>` | Single complete article |

Tools encapsulate smart retrieval logic; Resources expose raw data for clients that prefer to navigate the wiki themselves.

### Prompts (Instruction Templates)

- `wiki_query_system` — instructs the LLM to prefer `wiki_query`, avoid reading raw entries, and never fabricate information.
- `tech_news_prompt` — a templated instruction for summarizing technology news.

Prompts are exposed through MCP so that any compatible client (Claude Code, Cursor, custom agents) can learn how to query the wiki without per-client configuration.

## Query Modes

The wiki supports three query modes on the cyeam.com site:

| Mode | Data source | Thinking | Length | Role |
|---|---|---|---|---|
| Fast | Qdrant vector search only | None | ≤400 words | Golang/AI architect |
| Think | MCP wiki chain (`wiki_query` → `wiki_get_article`) | Streaming tool-call display | ≤400 words | Same architect |
| Expert | Qdrant + wiki dual channel | Two-stage streamed reasoning | Unlimited | Senior systems architect with code examples and comparisons |

## Key Design Decisions

- **Markdown over databases** — data is fully portable and version-controlled with Git.
- **`_index.md` as index** — human-readable and machine-parseable.
- **`[[wikilinks]]`** — natural link syntax for humans; relationship graph for machines.
- **Tools for retrieval** — LLMs are poor at exact-match search over large text corpora.
- **MCP over private API** — zero-cost integration with any MCP-compatible client.

## Relationship to Other Projects

The wiki pipeline is inspired by the `wiki-gen-skill` example, which achieves a full command-line wiki system through a single well-written `SKILL.md`. Cyeam MCP wraps the same concepts into an MCP server so that the wiki can be queried from any MCP-aware agent.
