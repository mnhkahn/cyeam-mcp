import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cyeam-calligraphy-"));
process.env.DB_PATH = path.join(tempDir, "calligraphy.db");

const calligraphy = await import("../src/calligraphy.ts");
const {
  closeDb,
  decomposeCharacter,
  getCompositionInstruction,
  getDb,
} = calligraphy;

test.before(() => {
  const db = getDb();
  db.exec(`
    INSERT OR IGNORE INTO characters (char, ids, structure, parts_json) VALUES
    ('利', '⿰禾刂', 'left-right', '[{"component_id":"禾","name":"禾","role":"left"},{"component_id":"刂","name":"刂","role":"right"}]'),
    ('灯', '⿰火丁', 'left-right', '[{"component_id":"火","name":"火","role":"left"},{"component_id":"丁","name":"丁","role":"right"}]');

    INSERT OR IGNORE INTO library (char, style, full_image_path, quality_score) VALUES
    ('利', '行书', 'library/行书/利.png', 0.70),
    ('灯', '行书', 'library/行书/灯.png', 0.80);

    INSERT OR IGNORE INTO char_parts (char, component_id, role, part_image_path, overlap_pct) VALUES
    ('利', '禾', 'left', 'parts/利_禾.png', 0),
    ('灯', '火', 'left', 'parts/灯_火.png', 0);
  `);
});

test.after(() => {
  closeDb();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("decomposes 秋 as a left-right 禾火 character", () => {
  assert.deepEqual(decomposeCharacter("秋"), {
    char: "秋",
    structure: "left-right",
    ids: "⿰禾火",
    parts: [
      { component_id: "禾", name: "禾", role: "left" },
      { component_id: "火", name: "火", role: "right" },
    ],
  });
});

test("falls back to same-component candidates when 秋 has no 火 right candidate", () => {
  const instruction = getCompositionInstruction("秋", "行书");
  const firePart = instruction.parts.find((part) => part.component_id === "火");

  assert.equal(firePart?.role, "right");
  assert.deepEqual(
    firePart?.candidates.map((candidate) => ({
      char: candidate.char,
      role: candidate.role,
    })),
    [{ char: "灯", role: "left" }]
  );
});
