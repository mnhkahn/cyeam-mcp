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

// 部件别名映射：偏旁变体 ↔ 标准部件（双向）
const COMPONENT_ALIASES: Record<string, string[]> = {
  // 王字旁
  "王": ["𤣩"],
  "𤣩": ["王"],
  // 水/氵/冫
  "水": ["氵"],
  "氵": ["水"],
  "冰": ["冫"],
  "冫": ["冰"],
  // 手/扌
  "手": ["扌"],
  "扌": ["手"],
  // 言/讠
  "言": ["讠"],
  "讠": ["言"],
  // 金/钅
  "金": ["钅"],
  "钅": ["金"],
  // 食/饣
  "食": ["饣"],
  "饣": ["食"],
  // 衣/衤
  "衣": ["衤"],
  "衤": ["衣"],
  // 示/礻
  "示": ["礻"],
  "礻": ["示"],
  // 犬/犭
  "犬": ["犭"],
  "犭": ["犬"],
  // 火/灬
  "火": ["灬"],
  "灬": ["火"],
  // 心/忄
  "心": ["忄"],
  "忄": ["心"],
  // 人/亻
  "人": ["亻"],
  "亻": ["人"],
  // 刀/刂
  "刀": ["刂"],
  "刂": ["刀"],
  // 阜/邑/阝（双耳旁，靠 role 区分左右）
  "阜": ["阝"],
  "邑": ["阝"],
  "阝": ["阜", "邑"],
  // 足/⻊
  "足": ["⻊"],
  "⻊": ["足"],
  // 肉/月（肉字旁）
  "肉": ["月"],
  "月": ["肉"],
  // 草/艹
  "草": ["艹"],
  "艹": ["草"],
  // 竹/⺮
  "竹": ["⺮"],
  "⺮": ["竹"],
  // 网/罒
  "网": ["罒"],
  "罒": ["网"],
  // 羊/⺶
  "羊": ["⺶"],
  "⺶": ["羊"],
  // 繁简互通
  "車": ["车"],
  "车": ["車"],
  "馬": ["马"],
  "马": ["馬"],
  "魚": ["鱼"],
  "鱼": ["魚"],
  "鳥": ["鸟"],
  "鸟": ["鳥"],
  "風": ["风"],
  "风": ["風"],
  "長": ["长"],
  "长": ["長"],
  "門": ["门"],
  "门": ["門"],
  "貝": ["贝"],
  "贝": ["貝"],
  "見": ["见"],
  "见": ["見"],
  "頁": ["页"],
  "页": ["頁"],
  "韋": ["韦"],
  "韦": ["韋"],
  "飛": ["飞"],
  "飞": ["飛"],
  "龍": ["龙"],
  "龙": ["龍"],
  "龜": ["龟"],
  "龟": ["龜"],
};

function resolveComponentAliases(componentId: string): string[] {
  const set = new Set([componentId]);
  for (const alias of COMPONENT_ALIASES[componentId] || []) {
    set.add(alias);
  }
  return Array.from(set);
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
  role: string;
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
  role?: string,
  style?: string
): ComponentCandidate[] {
  const database = getDb();
  const aliasIds = resolveComponentAliases(componentId);

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
    WHERE cp.component_id IN (${aliasIds.map(() => '?').join(',')})
  `;
  const params: (string | number)[] = [...aliasIds];

  if (role) {
    sql += ` AND cp.role = ?`;
    params.push(role);
  }

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
    role: r.role,
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
    let candidates = queryComponentCandidates(part.component_id, part.role, style);
    if (candidates.length === 0) {
      candidates = queryComponentCandidates(part.component_id, undefined, style);
    }

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
