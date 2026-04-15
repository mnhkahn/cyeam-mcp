#!/usr/bin/env python3
"""Rebuild _index.md and _backlinks.json from the wiki directory."""

import json
import os
import re
from pathlib import Path

WIKI_DIR = Path(__file__).parent.parent / "wiki"
INDEX_PATH = WIKI_DIR / "_index.md"
BACKLINKS_PATH = WIKI_DIR / "_backlinks.json"


def extract_frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            try:
                import yaml
                fm = yaml.safe_load(parts[1]) or {}
                return fm
            except Exception:
                pass
    return {}


def extract_wikilinks(text: str) -> list:
    return re.findall(r"\[\[(.+?)\]\]", text)


def main():
    articles = []
    backlinks = {}  # target -> set of sources

    for root, dirs, files in os.walk(WIKI_DIR):
        # skip hidden dirs
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for f in files:
            if not f.endswith(".md"):
                continue
            if f.startswith("_"):
                continue
            p = Path(root) / f
            rel = p.relative_to(WIKI_DIR)
            rel_str = str(rel.with_suffix("")).replace("\\", "/")
            dir_name = rel.parent.name if rel.parent.name else "(root)"

            fm = extract_frontmatter(p)
            title = fm.get("title") or rel.stem.replace("_", " ")
            articles.append({
                "title": title,
                "path": rel_str,
                "dir": dir_name,
            })

            text = p.read_text(encoding="utf-8")
            for link in extract_wikilinks(text):
                # normalize link to title-like string for matching
                target = link.strip()
                backlinks.setdefault(target, set())
                backlinks[target].add(rel_str)

    # Build index grouped by directory
    articles_by_dir = {}
    for art in articles:
        articles_by_dir.setdefault(art["dir"], []).append(art)

    index_lines = ["# Wiki Index\n"]
    for dir_name in sorted(articles_by_dir.keys()):
        index_lines.append(f"\n## {dir_name}")
        for art in sorted(articles_by_dir[dir_name], key=lambda x: x["title"]):
            index_lines.append(f"- [[{art['title']}]]")

    INDEX_PATH.write_text("\n".join(index_lines) + "\n", encoding="utf-8")

    # Build backlinks: map target title -> list of source paths
    # We need to resolve wikilink targets to actual article titles.
    # Build a map from title -> path and from path -> title
    title_to_path = {art["title"]: art["path"] for art in articles}
    path_to_title = {art["path"]: art["title"] for art in articles}

    # Also create lowercase title map for case-insensitive matching
    lower_title_to_path = {t.lower(): p for t, p in title_to_path.items()}

    backlinks_resolved = {}
    for target_link, sources in backlinks.items():
        # Try exact match, then case-insensitive, then keep as-is
        resolved = title_to_path.get(target_link)
        if resolved is None:
            resolved = lower_title_to_path.get(target_link.lower())
        if resolved is None:
            # fallback: guess path from link text
            guessed = target_link.replace(" ", "_").replace("/", "_")
            # check if any path ends with this
            for p, t in path_to_title.items():
                if p.lower().endswith(guessed.lower()):
                    resolved = p
                    break
        key = resolved if resolved else target_link
        backlinks_resolved[key] = sorted(sources)

    BACKLINKS_PATH.write_text(
        json.dumps(backlinks_resolved, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Index rebuilt: {INDEX_PATH} ({len(articles)} articles)")
    print(f"Backlinks rebuilt: {BACKLINKS_PATH} ({len(backlinks_resolved)} targets)")


if __name__ == "__main__":
    main()
