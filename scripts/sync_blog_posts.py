#!/usr/bin/env python3
"""Sync Jekyll blog posts into raw wiki entries without duplicating filenames."""

import argparse
import hashlib
import importlib.util
import re
from datetime import datetime
from pathlib import Path

import yaml


ROOT = Path(__file__).parent.parent
INGEST_PATH = Path(__file__).parent / "ingest.py"

spec = importlib.util.spec_from_file_location("ingest", INGEST_PATH)
ingest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ingest)


def parse_args():
    parser = argparse.ArgumentParser(description="Sync Jekyll _posts into raw/entries")
    parser.add_argument("--input", "-i", required=True, help="Jekyll _posts directory")
    parser.add_argument("--output", "-o", default="raw/entries", help="Raw entries directory")
    return parser.parse_args()


def existing_filenames(output_dir: Path) -> set[str]:
    filenames = set()
    for path in output_dir.glob("*.md"):
        text = path.read_text(encoding="utf-8")
        if not text.startswith("---"):
            continue
        parts = text.split("---", 2)
        if len(parts) < 3:
            continue
        try:
            fm = yaml.safe_load(parts[1]) or {}
        except Exception:
            continue
        filename = fm.get("filename")
        if filename:
            filenames.add(str(filename))
    return filenames


def read_post(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    try:
        return yaml.safe_load(parts[1]) or {}, parts[2].strip()
    except Exception:
        return {}, text


def post_date(path: Path, frontmatter: dict) -> str:
    raw_date = frontmatter.get("date")
    if raw_date:
        try:
            if hasattr(raw_date, "strftime"):
                return raw_date.strftime("%Y-%m-%d")
            return datetime.fromisoformat(str(raw_date).split()[0]).strftime("%Y-%m-%d")
        except Exception:
            pass
    match = re.search(r"(\d{4}-\d{2}-\d{2})", path.name)
    if match:
        return match.group(1)
    return datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d")


def make_id(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:12]


def main():
    args = parse_args()
    input_dir = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    seen = existing_filenames(output_dir)
    created = 0

    for post in sorted(input_dir.glob("*.md")):
        if post.name in seen:
            continue

        frontmatter, body = read_post(post)
        date_str = post_date(post, frontmatter)
        entry_id = make_id(post.read_text(encoding="utf-8"))
        fm = {
            "id": entry_id,
            "date": date_str,
            "source_type": "text",
            "tags": frontmatter.get("tags", []),
            "filename": post.name,
        }

        for key in ("title", "description", "category", "tags", "layout"):
            if key in frontmatter:
                fm[key] = frontmatter[key]
        for key, val in frontmatter.items():
            if key not in fm and key not in ("title", "description", "category", "tags", "layout"):
                fm[key] = val

        ingest.write_entry(output_dir, date_str, entry_id, fm, body)
        created += 1

    print(f"Synced {created} new blog posts from {input_dir} to {output_dir}")


if __name__ == "__main__":
    main()
