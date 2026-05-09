#!/usr/bin/env python3
"""
Import glyph data from ../wangxizhi/ocr_output/glyphs.sqlite into calligraphy.db.

1. Populate `library` table with available calligraphy images.
2. Supplement missing characters into `characters` / `char_parts` from IDS data.
3. Create `component_candidates` table.
4. Populate `component_candidates` based on char_parts + library intersection.

Image path convention: ../wangxizhi/<work_dir>/words/<id>.webp
"""

import json
import os
import sqlite3

DB_PATH = "calligraphy.db"
GLYPHS_DB = "../wangxizhi/ocr_output/glyphs.sqlite"
IDS_LOCAL = "data/cache/IDS.TXT"

# IDS 操作符映射
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


def is_idc(ch: str) -> bool:
    return "\u2FF0" <= ch <= "\u2FFF" or ch == "？"


def ids_subtree_length(s: str) -> int:
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
    operands = []
    i = 0
    while i < len(s) and len(operands) < n:
        sub = ids_subtree_length(s[i:])
        operands.append(s[i : i + sub])
        i += sub
    return operands


def parse_ids(ids_str: str):
    if not ids_str:
        return None, []
    first_idc = None
    for ch in ids_str:
        if is_idc(ch):
            first_idc = ch
            break
    if not first_idc:
        leaves = [c for c in ids_str if _is_unified_ideograph(c)]
        return ("single", leaves) if leaves else (None, [])
    structure, arity = IDC_MAP.get(first_idc, (None, 0))
    if not structure or arity == 0:
        return None, []
    idc_idx = ids_str.index(first_idc)
    remainder = ids_str[idc_idx + 1 :]
    operands = split_ids_operands(remainder, arity)
    if len(operands) != arity:
        return None, []
    all_leaves = []
    for op in operands:
        _, leaves = parse_ids(op)
        if not leaves:
            return None, []
        all_leaves.extend(leaves)
    return structure, all_leaves


def _is_unified_ideograph(ch: str) -> bool:
    cp = ord(ch)
    if 0x4E00 <= cp <= 0x9FFF:
        return True
    if 0x3400 <= cp <= 0x4DBF:
        return True
    if 0x20000 <= cp <= 0x2EBEF:
        return True
    if 0x2E80 <= cp <= 0x2EFF:
        return True
    if 0x2F00 <= cp <= 0x2FDF:
        return True
    if 0x31C0 <= cp <= 0x31EF:
        return True
    return False


def _contains_pua(s: str) -> bool:
    for c in s:
        cp = ord(c)
        if 0xE000 <= cp <= 0xF8FF:
            return True
        if 0xF0000 <= cp <= 0xFFFFD:
            return True
        if 0x100000 <= cp <= 0x10FFFD:
            return True
    return False


def assign_roles(structure: str, count: int):
    roles = ROLE_MAP.get(structure, [])
    if len(roles) == count:
        return roles
    if count == 1:
        return ["whole"]
    return [f"part{i + 1}" for i in range(count)]


def load_ids_map():
    ids_map = {}
    with open(IDS_LOCAL, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < 3:
                continue
            try:
                codepoint = int(parts[0].replace("U+", "").replace("u+", ""), 16)
                char = chr(codepoint)
            except (ValueError, OverflowError):
                continue
            raw_ids = parts[2]
            if raw_ids.startswith("^"):
                raw_ids = raw_ids[1:]
            if "$" in raw_ids:
                raw_ids = raw_ids.split("$")[0]
            if _contains_pua(raw_ids):
                continue
            if char not in ids_map:
                ids_map[char] = raw_ids
    print(f"  Loaded IDS data for {len(ids_map)} characters")
    return ids_map


def main():
    if not os.path.exists(DB_PATH):
        print(f"Database not found: {DB_PATH}")
        return
    if not os.path.exists(GLYPHS_DB):
        print(f"Glyphs DB not found: {GLYPHS_DB}")
        return

    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row

    # ------------------------------------------------------------------
    # 1. Create component_candidates table
    # ------------------------------------------------------------------
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS component_candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            component_id TEXT NOT NULL,
            candidate_char TEXT NOT NULL,
            priority INTEGER NOT NULL DEFAULT 0,
            UNIQUE(component_id, candidate_char)
        )
        """
    )
    db.execute(
        "CREATE INDEX IF NOT EXISTS idx_cc_component ON component_candidates(component_id)"
    )
    db.commit()
    print("Table `component_candidates` ready.")

    # ------------------------------------------------------------------
    # 2. Attach glyphs DB and populate `library`
    # ------------------------------------------------------------------
    db.execute("ATTACH DATABASE ? AS glyphs_db", (GLYPHS_DB,))

    db.execute("DELETE FROM library")
    db.commit()
    print("Cleared `library` table.")

    cursor = db.execute("SELECT g.id, g.char, g.work_dir, g.font FROM glyphs_db.glyphs g")
    inserted_library = 0
    for row in cursor:
        glyph_id = row["id"]
        char = row["char"]
        work_dir = row["work_dir"]
        style = row["font"]
        image_path = f"../wangxizhi/{work_dir}/words/{glyph_id}.webp"
        abs_path = os.path.join(os.path.dirname(os.path.abspath(DB_PATH)), image_path)
        if not os.path.exists(abs_path):
            continue
        cur = db.execute(
            "INSERT INTO library (char, style, full_image_path, quality_score) VALUES (?, ?, ?, 0)",
            (char, style, image_path),
        )
        if cur.rowcount > 0:
            inserted_library += 1

    db.commit()
    print(f"Inserted {inserted_library} records into `library`.")

    # ------------------------------------------------------------------
    # 3. Supplement missing characters from IDS
    # ------------------------------------------------------------------
    ids_map = load_ids_map()

    missing_chars = [c for (c,) in db.execute("""
        SELECT DISTINCT l.char FROM library l
        LEFT JOIN characters c ON l.char = c.char
        WHERE c.char IS NULL
    """)]

    print(f"Missing from characters table: {len(missing_chars)}")

    existing_components = {row[0] for row in db.execute("SELECT id FROM components")}
    inserted_chars = 0
    inserted_parts = 0
    inserted_components = 0
    skipped = 0

    for char in missing_chars:
        ids_str = ids_map.get(char)
        if not ids_str:
            # 无 IDS：尝试作为独体字导入
            structure = "single"
            leaves = [char] if _is_unified_ideograph(char) else []
            if not leaves:
                skipped += 1
                continue
        else:
            structure, leaves = parse_ids(ids_str)
            if not structure or not leaves:
                skipped += 1
                continue

        # 去重叶子
        seen = set()
        unique_leaves = []
        for leaf in leaves:
            if leaf not in seen:
                seen.add(leaf)
                unique_leaves.append(leaf)

        if len(unique_leaves) == 1 and structure != "single":
            structure = "single"

        # 严格模式：叶子数必须匹配结构 arity
        expected = ROLE_MAP.get(structure, [])
        if len(expected) != len(unique_leaves):
            skipped += 1
            continue

        roles = assign_roles(structure, len(unique_leaves))
        parts_json = json.dumps(
            [
                {"component_id": leaf, "name": leaf, "role": role}
                for leaf, role in zip(unique_leaves, roles)
            ],
            ensure_ascii=False,
        )

        # 插入 characters
        cur = db.execute(
            "INSERT OR IGNORE INTO characters (char, ids, structure, parts_json) VALUES (?, ?, ?, ?)",
            (char, ids_str or char, structure, parts_json),
        )
        if cur.rowcount > 0:
            inserted_chars += 1

        # 插入/补全 components
        for leaf in unique_leaves:
            if leaf not in existing_components:
                db.execute(
                    """
                    INSERT OR IGNORE INTO components
                    (id, name, is_radical, default_ratio, gravity_x, gravity_y, style_variant)
                    VALUES (?, ?, 0, NULL, 0.5, 0.5, NULL)
                    """,
                    (leaf, leaf),
                )
                existing_components.add(leaf)
                inserted_components += 1

        # 插入 char_parts
        for leaf, role in zip(unique_leaves, roles):
            cur = db.execute(
                """
                INSERT OR IGNORE INTO char_parts
                (char, component_id, role, part_image_path, overlap_pct)
                VALUES (?, ?, ?, NULL, 0)
                """,
                (char, leaf, role),
            )
            if cur.rowcount > 0:
                inserted_parts += 1

    db.commit()
    print(f"Supplemented: {inserted_chars} chars, {inserted_parts} parts, {inserted_components} components")
    print(f"Skipped (no IDS or arity mismatch): {skipped}")

    # ------------------------------------------------------------------
    # 4. Populate component_candidates
    # ------------------------------------------------------------------
    db.execute("DELETE FROM component_candidates")
    db.commit()
    print("Cleared `component_candidates` table.")

    cursor = db.execute(
        """
        SELECT DISTINCT cp.component_id, cp.char
        FROM char_parts cp
        INNER JOIN library l ON cp.char = l.char
        ORDER BY cp.component_id, cp.char
        """
    )
    inserted_candidates = 0
    for row in cursor:
        cur = db.execute(
            "INSERT OR IGNORE INTO component_candidates (component_id, candidate_char, priority) VALUES (?, ?, 0)",
            (row["component_id"], row["char"]),
        )
        if cur.rowcount > 0:
            inserted_candidates += 1

    db.commit()
    print(f"Inserted {inserted_candidates} records into `component_candidates`.")

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    stats = db.execute(
        """
        SELECT
            (SELECT COUNT(*) FROM library) AS lib_count,
            (SELECT COUNT(DISTINCT char) FROM library) AS lib_chars,
            (SELECT COUNT(*) FROM characters) AS char_count,
            (SELECT COUNT(*) FROM component_candidates) AS cc_count,
            (SELECT COUNT(DISTINCT component_id) FROM component_candidates) AS cc_components
        """
    ).fetchone()

    print("\n--- Summary ---")
    print(f"  Library records:      {stats['lib_count']}")
    print(f"  Library unique chars: {stats['lib_chars']}")
    print(f"  Total characters:     {stats['char_count']}")
    print(f"  Candidate records:    {stats['cc_count']}")
    print(f"  Candidate components: {stats['cc_components']}")

    db.execute("DETACH DATABASE glyphs_db")
    db.close()


if __name__ == "__main__":
    main()
