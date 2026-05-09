#!/usr/bin/env python3
"""
Import common Chinese characters from Unicode Unihan + BabelStone IDS
into calligraphy.db.

Usage:
    python scripts/import_unihan.py [--max-freq 3] [--limit 5000] [--strict]
    python scripts/import_unihan.py --dry-run    # 预览，不写入

Data sources:
    - Unihan.zip (https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip)
      Extracts kFrequency for filtering common characters.
    - IDS.TXT (https://babelstone.co.uk/CJK/IDS.TXT)
      Provides Ideographic Description Sequences for decomposition.

Filtering strategy:
    1. Keep characters with kFrequency <= max_freq (1=most common, 5=rare).
    2. Sort by frequency, then Unicode code point.
    3. Parse IDS; in strict mode, only keep characters whose leaf count
       exactly matches the top-level IDC arity (e.g. left-right -> 2 parts).
    4. Auto-create missing components with sensible defaults.
    5. Insert characters & char_parts with INSERT OR IGNORE.
"""

import argparse
import json
import os
import shutil
import sqlite3
import sys
import zipfile
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

# =============================================================================
# Configuration
# =============================================================================
DB_PATH = "calligraphy.db"
UNIHAN_URL = "https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip"
IDS_URL = "https://babelstone.co.uk/CJK/IDS.TXT"
CACHE_DIR = Path("data/cache")
UNIHAN_LOCAL = CACHE_DIR / "Unihan.zip"
IDS_LOCAL = CACHE_DIR / "IDS.TXT"

# IDS 操作符映射: char -> (structure_name, operand_count)
IDC_MAP = {
    "⿰": ("left-right", 2),
    "⿱": ("top-bottom", 2),
    "⿲": ("left-mid-right", 3),
    "⿳": ("top-mid-bottom", 3),
    "⿴": ("full-surround", 2),
    "⿵": ("top-surround", 2),
    "⿶": ("bottom-surround", 2),
    "⿷": ("left-surround", 2),
    "⿸": ("top-left-surround", 2),
    "⿹": ("top-right-surround", 2),
    "⿺": ("bottom-left-surround", 2),
    "⿻": ("overlay", 2),
    "⿼": ("surround", 2),
    "⿽": ("surround", 2),
    "⿾": ("rotate", 1),
    "⿿": ("reflect", 1),
}

# Role templates per structure
ROLE_MAP = {
    "left-right": ["left", "right"],
    "top-bottom": ["top", "bottom"],
    "left-mid-right": ["left", "middle", "right"],
    "top-mid-bottom": ["top", "middle", "bottom"],
    "full-surround": ["outside", "inside"],
    "top-surround": ["outside", "inside"],
    "bottom-surround": ["outside", "inside"],
    "left-surround": ["outside", "inside"],
    "top-left-surround": ["outside", "inside"],
    "top-right-surround": ["outside", "inside"],
    "bottom-left-surround": ["outside", "inside"],
    "overlay": ["base", "overlay"],
    "surround": ["outside", "inside"],
    "rotate": ["whole"],
    "reflect": ["whole"],
    "single": ["whole"],
}


# =============================================================================
# IDS parsing
# =============================================================================
def is_idc(ch: str) -> bool:
    """判断是否为 IDS 描述符（Ideographic Description Character）"""
    return "\u2FF0" <= ch <= "\u2FFF" or ch == "？"


def ids_subtree_length(s: str) -> int:
    """返回从位置 0 开始的完整 IDS 子串长度。"""
    if not s:
        return 0
    if not is_idc(s[0]):
        return 1
    _, arity = IDC_MAP.get(s[0], (None, 0))
    if arity == 0:
        return 1
    if arity == 1:
        return 1 + ids_subtree_length(s[1:])

    length = 1
    count = 0
    i = 1
    while i < len(s) and count < arity:
        sub = ids_subtree_length(s[i:])
        length += sub
        i += sub
        count += 1
    return length


def split_ids_operands(s: str, n: int):
    """将 IDS 字符串拆分为 n 个操作数。"""
    operands = []
    i = 0
    while i < len(s) and len(operands) < n:
        sub = ids_subtree_length(s[i:])
        operands.append(s[i : i + sub])
        i += sub
    return operands


def parse_ids(ids_str: str):
    """
    解析 IDS 字符串，递归收集叶子节点。
    返回: (structure, [leaf_char, ...])  或 (None, []) 表示解析失败/跳过。
    """
    if not ids_str:
        return None, []

    # 找到第一个 IDC
    first_idc = None
    for ch in ids_str:
        if is_idc(ch):
            first_idc = ch
            break

    if not first_idc:
        # 独体字：没有 IDC
        leaves = [c for c in ids_str if _is_unified_ideograph(c)]
        return ("single", leaves) if leaves else (None, [])

    structure, arity = IDC_MAP.get(first_idc, (None, 0))
    if not structure or arity == 0:
        return None, []

    # 拆分顶层操作数
    idc_idx = ids_str.index(first_idc)
    remainder = ids_str[idc_idx + 1 :]
    operands = split_ids_operands(remainder, arity)
    if len(operands) != arity:
        return None, []

    # 递归收集叶子
    all_leaves = []
    for op in operands:
        _, leaves = parse_ids(op)
        if not leaves:
            return None, []
        all_leaves.extend(leaves)

    return structure, all_leaves


def _is_unified_ideograph(ch: str) -> bool:
    """判断字符是否为合法的汉字/部首/笔画部件（排除 PUA、符号等）。"""
    cp = ord(ch)
    # CJK Unified Ideographs (基本区)
    if 0x4E00 <= cp <= 0x9FFF:
        return True
    # CJK Unified Ideographs Extension A
    if 0x3400 <= cp <= 0x4DBF:
        return True
    # Extension B-F
    if 0x20000 <= cp <= 0x2EBEF:
        return True
    # CJK Radicals Supplement (部首补充)
    if 0x2E80 <= cp <= 0x2EFF:
        return True
    # Kangxi Radicals (康熙部首)
    if 0x2F00 <= cp <= 0x2FDF:
        return True
    # CJK Strokes (笔画)
    if 0x31C0 <= cp <= 0x31EF:
        return True
    return False


def _contains_pua(s: str) -> bool:
    """检查字符串是否包含 Private Use Area 字符。"""
    for c in s:
        cp = ord(c)
        if 0xE000 <= cp <= 0xF8FF:
            return True
        if 0xF0000 <= cp <= 0xFFFFD:
            return True
        if 0x100000 <= cp <= 0x10FFFD:
            return True
    return False


# =============================================================================
# Role assignment
# =============================================================================
def assign_roles(structure: str, count: int):
    """根据结构和部件数量分配 role。数量不匹配时回退到通用命名。"""
    roles = ROLE_MAP.get(structure, [])
    if len(roles) == count:
        return roles
    if count == 1:
        return ["whole"]
    return [f"part{i + 1}" for i in range(count)]


# =============================================================================
# Data fetching
# =============================================================================
def fetch_unihan_iicore():
    """下载 Unihan.zip 并解析 kIICore 字段（IRG 国际表意文字核心）。优先使用本地缓存。"""
    if UNIHAN_LOCAL.exists():
        print(f"Using cached {UNIHAN_LOCAL}")
        data = BytesIO(UNIHAN_LOCAL.read_bytes())
    else:
        print(f"Fetching {UNIHAN_URL} ...")
        try:
            resp = urlopen(UNIHAN_URL, timeout=120)
            data = BytesIO(resp.read())
        except Exception as e:
            print(f"Error downloading Unihan.zip: {e}")
            return set()

    iicore = set()
    with zipfile.ZipFile(data) as zf:
        filename = "Unihan_IRGSources.txt"
        if filename not in zf.namelist():
            print(f"Warning: {filename} not found in zip")
            return set()
        with zf.open(filename) as f:
            for raw in f:
                line = raw.decode("utf-8").strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split("\t")
                if len(parts) >= 2 and parts[1] == "kIICore":
                    try:
                        code = int(parts[0][2:], 16)  # U+4E00 -> 0x4E00
                        char = chr(code)
                        iicore.add(char)
                    except (ValueError, OverflowError):
                        continue
    print(f"  Loaded IICore data for {len(iicore)} characters")
    return iicore


def fetch_ids_data():
    """下载并解析 BabelStone IDS.TXT。优先使用本地缓存。"""
    if IDS_LOCAL.exists():
        print(f"Using cached {IDS_LOCAL}")
        text = IDS_LOCAL.read_text(encoding="utf-8")
    else:
        print(f"Fetching {IDS_URL} ...")
        try:
            resp = urlopen(IDS_URL, timeout=120)
            text = resp.read().decode("utf-8")
        except Exception as e:
            print(f"Error downloading IDS.TXT: {e}")
            return {}

    ids_map = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        try:
            codepoint = int(parts[0].replace("U+", "").replace("u+", ""), 16)
            char = chr(codepoint)
        except (ValueError, OverflowError):
            continue

        # IDS 从第 3 列开始（parts[2]），格式如 ^⿱亚丿$(G)
        if len(parts) < 3:
            continue
        raw_ids = parts[2]
        # 提取 ^...$ 之间的部分
        if raw_ids.startswith("^"):
            raw_ids = raw_ids[1:]
        if "$" in raw_ids:
            raw_ids = raw_ids.split("$")[0]
        # 跳过包含 PUA 字符的 IDS
        if _contains_pua(raw_ids):
            continue
        # 保留第一个 IDS 版本（通常最标准）
        if char not in ids_map:
            ids_map[char] = raw_ids

    print(f"  Loaded IDS data for {len(ids_map)} characters")
    return ids_map


# =============================================================================
# Main import logic
# =============================================================================
def main():
    parser = argparse.ArgumentParser(
        description="Import common Unihan characters into calligraphy.db"
    )
    parser.add_argument(
        "--filter",
        choices=["iicore", "all-basic"],
        default="iicore",
        help="Character set to import: iicore (~9700 basic chars) or all-basic (~20992 CJK basic). Default: iicore",
    )
    parser.add_argument(
        "--include-exta",
        action="store_true",
        help="Include Extension A (U+3400~U+4DBF) characters. Default: only basic block (U+4E00~U+9FFF)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=3000,
        help="Maximum number of characters to import. Default: 3000",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        default=True,
        help="Only import characters whose leaf count matches IDC arity (default: True)",
    )
    parser.add_argument(
        "--no-strict",
        action="store_true",
        help="Disable strict mode: allow mismatched leaf counts",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be imported without writing to DB",
    )
    args = parser.parse_args()

    strict = not args.no_strict

    if not os.path.exists(DB_PATH):
        print(f"Database not found: {DB_PATH}")
        sys.exit(1)

    # Backup DB once
    backup_path = f"{DB_PATH}.backup"
    if os.path.exists(DB_PATH) and not os.path.exists(backup_path):
        shutil.copy2(DB_PATH, backup_path)
        print(f"Backed up to {backup_path}")

    # -------------------------------------------------------------------------
    # Fetch data
    # -------------------------------------------------------------------------
    ids_map = fetch_ids_data()

    if args.filter == "iicore":
        char_set = fetch_unihan_iicore()
        print(f"Filter: IICore ({len(char_set)} chars)")
    else:
        char_set = set()
        for cp in range(0x4E00, 0x9FFF + 1):
            char_set.add(chr(cp))
        print(f"Filter: All basic CJK ({len(char_set)} chars)")

    # -------------------------------------------------------------------------
    # Select candidates
    # -------------------------------------------------------------------------
    candidates = []
    for char in char_set:
        if char in ids_map:
            cp = ord(char)
            if args.include_exta or (0x4E00 <= cp <= 0x9FFF):
                candidates.append(char)

    # Sort by Unicode code point for determinism
    candidates.sort(key=lambda c: ord(c))
    candidates = candidates[: args.limit]

    print(f"Selected {len(candidates)} candidate characters (with IDS data)")

    # -------------------------------------------------------------------------
    # Parse IDS for each candidate
    # -------------------------------------------------------------------------
    records = []          # (char, ids, structure, parts_json, [component_ids])
    new_components = set()
    skipped = []          # (char, reason) for reporting

    for char in candidates:
        ids_str = ids_map[char]
        structure, leaves = parse_ids(ids_str)

        if not structure or not leaves:
            skipped.append((char, "IDS parse failed"))
            continue

        # Deduplicate leaves while preserving order
        seen = set()
        unique_leaves = []
        for leaf in leaves:
            if leaf not in seen:
                seen.add(leaf)
                unique_leaves.append(leaf)

        # Adjust single-component structures
        if len(unique_leaves) == 1 and structure != "single":
            structure = "single"

        # Strict mode: leaf count must match IDC arity
        if strict:
            expected = ROLE_MAP.get(structure, [])
            if len(expected) != len(unique_leaves):
                skipped.append(
                    (char, f"arity mismatch: {structure} expects {len(expected)}, got {len(unique_leaves)}")
                )
                continue

        roles = assign_roles(structure, len(unique_leaves))
        parts_json = json.dumps(
            [
                {"component_id": leaf, "name": leaf, "role": role}
                for leaf, role in zip(unique_leaves, roles)
            ],
            ensure_ascii=False,
        )

        records.append((char, ids_str, structure, parts_json, unique_leaves))
        for leaf in unique_leaves:
            if leaf != char:
                new_components.add(leaf)

    print(f"Successfully parsed: {len(records)} characters")
    print(f"Skipped: {len(skipped)} characters")
    print(f"New components to create: {len(new_components)}")

    if args.dry_run:
        print("\n--- Sample (first 15) ---")
        for r in records[:15]:
            print(f"  {r[0]}  {r[1]:12s}  {r[2]:20s}  {r[3]}")
        if skipped:
            print("\n--- Skipped sample (first 10) ---")
            for char, reason in skipped[:10]:
                print(f"  {char}  {reason}")
        return

    # -------------------------------------------------------------------------
    # Write to database
    # -------------------------------------------------------------------------
    db = sqlite3.connect(DB_PATH)

    # Existing components
    existing_components = {
        row[0] for row in db.execute("SELECT id FROM components")
    }

    # Insert new components
    comp_inserted = 0
    for comp_id in new_components:
        if comp_id not in existing_components:
            db.execute(
                """
                INSERT OR IGNORE INTO components
                (id, name, is_radical, default_ratio, gravity_x, gravity_y, style_variant)
                VALUES (?, ?, 0, NULL, 0.5, 0.5, NULL)
                """,
                (comp_id, comp_id),
            )
            comp_inserted += 1

    # Insert characters
    char_inserted = 0
    for char, ids_str, structure, parts_json, _ in records:
        cur = db.execute(
            "INSERT OR IGNORE INTO characters (char, ids, structure, parts_json) VALUES (?, ?, ?, ?)",
            (char, ids_str, structure, parts_json),
        )
        if cur.rowcount > 0:
            char_inserted += 1

    # Insert char_parts
    parts_inserted = 0
    for char, _, structure, _, leaves in records:
        roles = assign_roles(structure, len(leaves))
        for comp_id, role in zip(leaves, roles):
            cur = db.execute(
                """
                INSERT OR IGNORE INTO char_parts
                (char, component_id, role, part_image_path, overlap_pct)
                VALUES (?, ?, ?, NULL, 0)
                """,
                (char, comp_id, role),
            )
            if cur.rowcount > 0:
                parts_inserted += 1

    db.commit()
    db.close()

    print("\n--- Import Summary ---")
    print(f"  Components inserted: {comp_inserted}")
    print(f"  Characters inserted: {char_inserted}")
    print(f"  Char parts inserted: {parts_inserted}")
    print(f"  Total skipped:       {len(skipped)}")


if __name__ == "__main__":
    main()
