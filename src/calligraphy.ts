import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.DB_PATH || "./calligraphy.db";
const INIT_SQL_PATH = path.resolve(process.cwd(), "data/init.sql");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const needsInit = !fs.existsSync(DB_PATH);
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    if (needsInit) {
      if (!fs.existsSync(INIT_SQL_PATH)) {
        throw new Error(`init.sql not found at ${INIT_SQL_PATH}`);
      }
      const sql = fs.readFileSync(INIT_SQL_PATH, "utf-8");
      db.exec(sql);
    }
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export interface DecomposedCharacter {
  char: string;
  structure: string;
  ids: string;
  parts: Array<{
    component_id: string;
    name: string;
    role: string;
  }>;
}

export interface ComponentCandidate {
  char: string;
  part_image_path: string | null;
  quality_score: number;
  full_image_path: string;
}

export interface CompositionPart {
  component_id: string;
  name: string;
  role: string;
  ratio: number | null;
  gravity_x: number | null;
  gravity_y: number | null;
  style_variant: string | null;
  candidates: ComponentCandidate[];
}

export interface CompositionInstruction {
  char: string;
  structure: string;
  ids: string;
  parts: CompositionPart[];
}

export function decomposeCharacter(char: string): DecomposedCharacter {
  const database = getDb();
  const row = database
    .prepare("SELECT char, ids, structure, parts_json FROM characters WHERE char = ?")
    .get(char) as
    | { char: string; ids: string; structure: string; parts_json: string }
    | undefined;

  if (!row) {
    throw new Error(`未收录汉字: ${char}`);
  }

  let parts: DecomposedCharacter["parts"] = [];
  try {
    parts = JSON.parse(row.parts_json);
  } catch {
    parts = [];
  }

  return {
    char: row.char,
    structure: row.structure,
    ids: row.ids,
    parts,
  };
}

export function queryComponentCandidates(
  componentId: string,
  style?: string
): ComponentCandidate[] {
  const database = getDb();

  let sql = `
    SELECT
      cp.char,
      cp.component_id,
      cp.role,
      cp.part_image_path,
      l.full_image_path,
      l.quality_score
    FROM char_parts cp
    INNER JOIN library l ON cp.char = l.char
    WHERE cp.component_id = ?
  `;
  const params: (string | number)[] = [componentId];

  if (style) {
    sql += ` AND l.style = ?`;
    params.push(style);
  }

  sql += ` ORDER BY l.quality_score DESC`;

  const rows = database.prepare(sql).all(...params) as Array<{
    char: string;
    component_id: string;
    role: string;
    part_image_path: string | null;
    full_image_path: string;
    quality_score: number;
  }>;

  return rows.map((r) => ({
    char: r.char,
    part_image_path: r.part_image_path,
    quality_score: r.quality_score,
    full_image_path: r.full_image_path,
  }));
}

export function getCompositionInstruction(
  char: string,
  style?: string
): CompositionInstruction {
  const decomposed = decomposeCharacter(char);
  const database = getDb();

  const compStmt = database.prepare<
    [string],
    {
      id: string;
      name: string;
      default_ratio: number | null;
      gravity_x: number | null;
      gravity_y: number | null;
      style_variant: string | null;
    }
  >("SELECT id, name, default_ratio, gravity_x, gravity_y, style_variant FROM components WHERE id = ?");

  const parts: CompositionPart[] = decomposed.parts.map((part) => {
    const comp = compStmt.get(part.component_id);
    const candidates = queryComponentCandidates(part.component_id, style);

    return {
      component_id: part.component_id,
      name: comp?.name ?? part.name ?? part.component_id,
      role: part.role,
      ratio: comp?.default_ratio ?? null,
      gravity_x: comp?.gravity_x ?? null,
      gravity_y: comp?.gravity_y ?? null,
      style_variant: comp?.style_variant ?? null,
      candidates: candidates.slice(0, 20),
    };
  });

  return {
    char: decomposed.char,
    structure: decomposed.structure,
    ids: decomposed.ids,
    parts,
  };
}
