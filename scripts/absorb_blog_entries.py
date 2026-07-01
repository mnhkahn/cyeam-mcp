#!/usr/bin/env python3
"""Absorb synced blog raw entries into simple wiki articles.

This is a deterministic bridge for CI. It does not try to synthesize a whole
knowledge graph like the interactive wiki skill; it creates one wiki article per
new blog post so fresh posts are queryable by the MCP server.
"""

import argparse
import re
from pathlib import Path

import yaml


def parse_args():
    parser = argparse.ArgumentParser(description="Absorb blog raw entries into wiki articles")
    parser.add_argument("--raw", default="raw/entries", help="Raw entries directory")
    parser.add_argument("--wiki", default="wiki", help="Wiki directory")
    return parser.parse_args()


def split_frontmatter(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}, text.strip()
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text.strip()
    try:
        return yaml.safe_load(parts[1]) or {}, parts[2].strip()
    except Exception:
        return {}, text.strip()


def absorbed_source_ids(wiki_dir: Path) -> set[str]:
    source_ids = set()
    for path in wiki_dir.rglob("*.md"):
        if path.name.startswith("_"):
            continue
        frontmatter, _ = split_frontmatter(path)
        for source in frontmatter.get("sources") or []:
            source_ids.add(str(source))
    return source_ids


def slug_from_filename(filename: str, title: str) -> str:
    stem = Path(filename).stem if filename else title
    stem = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", stem)
    slug = re.sub(r"[^A-Za-z0-9]+", "_", stem).strip("_").lower()
    return slug or "untitled"


def wiki_dir_for_entry(frontmatter: dict) -> str:
    category = str(frontmatter.get("category") or "").strip().lower()
    tags = [str(tag).lower() for tag in frontmatter.get("tags") or []]
    if category in {"ai", "golang", "go", "tech"}:
        return "techniques"
    if any(tag in {"ai", "golang", "go", "mcp", "claude", "gpt"} for tag in tags):
        return "techniques"
    return "techniques"


def clean_body(body: str) -> str:
    lines = body.splitlines()
    cleaned = []
    skip_next_toc_marker = False
    for line in lines:
        stripped = line.strip()
        if stripped in {"* 目录", "- 目录"}:
            skip_next_toc_marker = True
            continue
        if skip_next_toc_marker and stripped == "{:toc}":
            skip_next_toc_marker = False
            continue
        skip_next_toc_marker = False
        if stripped == "---":
            continue
        cleaned.append(line)
    return "\n".join(cleaned).strip()


def render_article(frontmatter: dict, body: str) -> str:
    title = str(frontmatter.get("title") or "Untitled").strip()
    date = str(frontmatter.get("date") or "").strip().strip("'")
    source_id = str(frontmatter.get("id") or "").strip()
    description = str(frontmatter.get("description") or "").strip()
    filename = str(frontmatter.get("filename") or "").strip()
    related = []
    tags = [str(tag) for tag in frontmatter.get("tags") or []]
    if any(tag.lower() in {"ai", "claude", "gpt", "模型"} for tag in tags):
        related.append("[[Large Language Models]]")
    if any(tag.lower() in {"mcp", "agent"} for tag in tags):
        related.append("[[Model Context Protocol]]")

    fm = [
        "---",
        f"title: {title}",
        "type: techniques",
        f"created: {date}",
        f"last_updated: {date}",
        "related: [" + ", ".join(f'"{item}"' for item in related) + "]",
        f'sources: ["{source_id}"]',
        f"original_filename: {filename}",
    ]
    if description:
        fm.append(f"description: {description}")
    fm.extend(["---", "", f"# {title}", ""])
    if description:
        fm.extend([description, ""])
    article_body = clean_body(body)
    if article_body:
        fm.append(article_body)
        fm.append("")
    return "\n".join(fm)


def absorb(raw_dir: Path, wiki_dir: Path) -> list[str]:
    existing_sources = absorbed_source_ids(wiki_dir)
    created = []
    for path in sorted(raw_dir.glob("*.md")):
        frontmatter, body = split_frontmatter(path)
        source_id = str(frontmatter.get("id") or "").strip()
        filename = str(frontmatter.get("filename") or "").strip()
        if not source_id or source_id in existing_sources:
            continue
        if frontmatter.get("source_type") != "text" or frontmatter.get("layout") != "post":
            continue
        title = str(frontmatter.get("title") or "").strip()
        if not title:
            continue

        subdir = wiki_dir_for_entry(frontmatter)
        slug = slug_from_filename(filename, title)
        target = wiki_dir / subdir / f"{slug}.md"
        if target.exists():
            continue

        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(render_article(frontmatter, body), encoding="utf-8")
        created.append(str(target.relative_to(wiki_dir)))
    return created


def main():
    args = parse_args()
    created = absorb(Path(args.raw), Path(args.wiki))
    for article in created:
        print(f"  wrote wiki/{article}")
    print(f"Absorbed {len(created)} blog entries into wiki articles")


if __name__ == "__main__":
    main()
