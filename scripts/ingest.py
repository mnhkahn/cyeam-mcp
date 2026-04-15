"""Wiki ingest 脚本 —— 将原始数据转换为 raw markdown entries。

支持格式：
- Day One JSON
- Apple Notes (html/txt/md)
- Obsidian Vault
- Notion Export
- Plain Text / Markdown
- CSV / Spreadsheet
- iMessage Export
- Email Export
- Twitter/X Archive

使用方式:
    python scripts/ingest.py --input data/dayone.json --output raw/entries
"""

import argparse
import hashlib
import json
import os
import re
from datetime import datetime
from pathlib import Path

import yaml


def parse_args():
    parser = argparse.ArgumentParser(description="Ingest personal data into raw markdown entries")
    parser.add_argument("--input", "-i", required=True, help="Input file or directory")
    parser.add_argument("--output", "-o", default="raw/entries", help="Output directory")
    return parser.parse_args()


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def make_id(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:12]


def write_entry(output_dir: Path, date_str: str, entry_id: str, frontmatter: dict, body: str):
    filename = f"{date_str}_{entry_id}.md"
    path = output_dir / filename
    content = "---\n" + yaml.dump(frontmatter, allow_unicode=True, sort_keys=False) + "---\n\n" + body
    path.write_text(content, encoding="utf-8")
    print(f"  wrote {path}")


def detect_format(input_path: Path) -> str:
    if input_path.is_file():
        suffix = input_path.suffix.lower()
        if suffix == ".json":
            text = input_path.read_text(encoding="utf-8")
            data = json.loads(text)
            if "entries" in data:
                return "dayone"
            if "tweets" in data or "tweet" in str(data):
                return "twitter"
        if suffix in (".csv", ".tsv"):
            return "csv"
        if suffix == ".mbox":
            return "email"
        if suffix in (".txt", ".md"):
            return "text"
        if suffix == ".html":
            return "apple-notes"
    if input_path.is_dir():
        children = list(input_path.iterdir())
        # Jekyll _posts style: dated markdown filenames
        if any(re.search(r"\d{4}-\d{2}-\d{2}", c.name) and c.suffix == ".md" for c in children if isinstance(c, Path)):
            return "text"
        if any(c.suffix == ".md" for c in children if isinstance(c, Path)):
            return "obsidian"
        return "text"
    return "unknown"


def ingest_dayone(input_path: Path, output_dir: Path):
    data = json.loads(input_path.read_text(encoding="utf-8"))
    entries = data.get("entries", [])
    for entry in entries:
        created = entry.get("creationDate", "")
        dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
        date_str = dt.strftime("%Y-%m-%d")
        time_str = dt.strftime("%H:%M:%S")
        entry_id = entry.get("uuid", make_id(json.dumps(entry, sort_keys=True)))
        text = entry.get("text", "")
        fm = {
            "id": entry_id,
            "date": date_str,
            "time": time_str,
            "source_type": "dayone",
            "tags": entry.get("tags", []),
        }
        if entry.get("location"):
            fm["location"] = entry["location"]
        if entry.get("weather"):
            fm["weather"] = entry["weather"]
        write_entry(output_dir, date_str, entry_id, fm, text)


def ingest_text(input_path: Path, output_dir: Path):
    files = [input_path] if input_path.is_file() else list(input_path.rglob("*.md")) + list(input_path.rglob("*.txt"))
    for f in files:
        text = f.read_text(encoding="utf-8")
        entry_id = make_id(text)
        # 尝试从文件名提取日期
        date_match = re.search(r"(\d{4}-\d{2}-\d{2})", f.name)
        date_str = date_match.group(1) if date_match else datetime.fromtimestamp(f.stat().st_mtime).strftime("%Y-%m-%d")

        # 解析 YAML frontmatter（Jekyll / Obsidian 风格）
        body = text
        fm_meta = {}
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                try:
                    fm_meta = yaml.safe_load(parts[1]) or {}
                    body = parts[2].strip()
                except Exception:
                    pass

        fm = {
            "id": entry_id,
            "date": date_str,
            "source_type": "text",
            "tags": [],
            "filename": f.name,
        }
        # 将 frontmatter 中的常用字段提升到顶层
        for key in ("title", "description", "category", "tags", "layout"):
            if key in fm_meta:
                fm[key] = fm_meta[key]
        # 保留其他未识别的 frontmatter 字段
        for key, val in fm_meta.items():
            if key not in fm and key not in ("title", "description", "category", "tags", "layout"):
                fm[key] = val

        write_entry(output_dir, date_str, entry_id, fm, body)


def ingest_csv(input_path: Path, output_dir: Path):
    import csv
    delimiter = "\t" if input_path.suffix.lower() == ".tsv" else ","
    with open(input_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=delimiter)
        rows = list(reader)

    # 自动检测日期列和内容列
    date_col = None
    text_col = None
    if rows:
        headers = list(rows[0].keys())
        for h in headers:
            if "date" in h.lower() and date_col is None:
                date_col = h
            if any(k in h.lower() for k in ("content", "text", "body", "entry", "note")) and text_col is None:
                text_col = h
        if text_col is None:
            text_col = headers[-1]
        if date_col is None:
            date_col = headers[0]

    for row in rows:
        raw_date = row.get(date_col, "")
        try:
            dt = datetime.fromisoformat(raw_date)
            date_str = dt.strftime("%Y-%m-%d")
            time_str = dt.strftime("%H:%M:%S")
        except Exception:
            date_str = datetime.now().strftime("%Y-%m-%d")
            time_str = "00:00:00"
        text = row.get(text_col, "")
        entry_id = make_id(json.dumps(row, sort_keys=True))
        fm = {
            "id": entry_id,
            "date": date_str,
            "time": time_str,
            "source_type": "csv",
            "tags": [],
        }
        # 其他列作为 metadata
        for k, v in row.items():
            if k not in (date_col, text_col):
                fm[k] = v
        write_entry(output_dir, date_str, entry_id, fm, text)


def main():
    args = parse_args()
    input_path = Path(args.input)
    output_dir = ensure_dir(Path(args.output))

    fmt = detect_format(input_path)
    print(f"Detected format: {fmt}")

    if fmt == "dayone":
        ingest_dayone(input_path, output_dir)
    elif fmt == "text":
        ingest_text(input_path, output_dir)
    elif fmt == "csv":
        ingest_csv(input_path, output_dir)
    else:
        print(f"Format '{fmt}' not fully supported yet. Please extend ingest.py.")
        return

    print(f"\nDone. Entries written to {output_dir}")


if __name__ == "__main__":
    main()
