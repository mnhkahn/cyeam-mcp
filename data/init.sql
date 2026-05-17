-- ============================================
-- Calligraphy Decomposition Database Schema
-- ============================================

-- 1. characters: 字 → IDS、结构、部件 JSON 数组
CREATE TABLE IF NOT EXISTS characters (
    char TEXT PRIMARY KEY,
    ids TEXT NOT NULL,
    structure TEXT NOT NULL,
    parts_json TEXT NOT NULL
);

-- 2. components: 部件元数据
CREATE TABLE IF NOT EXISTS components (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_radical INTEGER NOT NULL DEFAULT 0,
    default_ratio REAL,
    gravity_x REAL DEFAULT 0.5,
    gravity_y REAL DEFAULT 0.5,
    style_variant TEXT
);

-- 3. char_parts: 字-部件倒排关联
CREATE TABLE IF NOT EXISTS char_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    char TEXT NOT NULL,
    component_id TEXT NOT NULL,
    role TEXT NOT NULL,
    part_image_path TEXT,
    overlap_pct REAL DEFAULT 0,
    FOREIGN KEY (char) REFERENCES characters(char),
    FOREIGN KEY (component_id) REFERENCES components(id)
);

-- 4. library: 用户字库
CREATE TABLE IF NOT EXISTS library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    char TEXT NOT NULL,
    style TEXT NOT NULL,
    full_image_path TEXT NOT NULL,
    quality_score REAL NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_char_parts_component ON char_parts(component_id);
CREATE INDEX IF NOT EXISTS idx_char_parts_char ON char_parts(char);
CREATE INDEX IF NOT EXISTS idx_char_parts_role ON char_parts(role);
CREATE INDEX IF NOT EXISTS idx_library_char ON library(char);
CREATE INDEX IF NOT EXISTS idx_library_style ON library(style);
CREATE INDEX IF NOT EXISTS idx_library_char_style ON library(char, style);

-- ============================================
-- Seed: Components (约 60 个常用偏旁/部件)
-- ============================================
INSERT OR IGNORE INTO components (id, name, is_radical, default_ratio, gravity_x, gravity_y, style_variant) VALUES
-- 常用左右结构偏旁
('王', '王字旁', 1, 0.35, 0.55, 0.50, NULL),
('玉', '玉', 0, 0.50, 0.50, 0.50, NULL),
('立', '立字旁', 1, 0.35, 0.55, 0.50, NULL),
('亻', '单人旁', 1, 0.30, 0.60, 0.50, NULL),
('氵', '三点水', 1, 0.35, 0.55, 0.50, NULL),
('扌', '提手旁', 1, 0.35, 0.55, 0.50, NULL),
('口', '口字旁', 1, 0.30, 0.50, 0.50, NULL),
('木', '木字旁', 1, 0.40, 0.55, 0.50, NULL),
('纟', '绞丝旁', 1, 0.35, 0.55, 0.50, NULL),
('讠', '言字旁', 1, 0.30, 0.60, 0.50, NULL),
('钅', '金字旁', 1, 0.35, 0.55, 0.50, NULL),
('阝', '双耳旁', 1, 0.30, 0.60, 0.50, NULL),
('女', '女字旁', 1, 0.40, 0.55, 0.50, NULL),
('土', '土字旁', 1, 0.35, 0.55, 0.50, NULL),
('火', '火字旁', 1, 0.35, 0.55, 0.50, NULL),
('石', '石字旁', 1, 0.40, 0.55, 0.50, NULL),
('目', '目字旁', 1, 0.40, 0.55, 0.50, NULL),
('虫', '虫字旁', 1, 0.40, 0.55, 0.50, NULL),
('舟', '舟字旁', 1, 0.40, 0.55, 0.50, NULL),
('足', '足字旁', 1, 0.40, 0.55, 0.50, NULL),
('车', '车字旁', 1, 0.35, 0.55, 0.50, NULL),
('马', '马字旁', 1, 0.35, 0.55, 0.50, NULL),
('鱼', '鱼字旁', 1, 0.40, 0.55, 0.50, NULL),
('饣', '食字旁', 1, 0.35, 0.55, 0.50, NULL),
('礻', '示字旁', 1, 0.35, 0.55, 0.50, NULL),
('衤', '衣字旁', 1, 0.35, 0.55, 0.50, NULL),
('犭', '反犬旁', 1, 0.35, 0.55, 0.50, NULL),
('月', '月字旁', 1, 0.35, 0.55, 0.50, NULL),
('日', '日字旁', 1, 0.35, 0.55, 0.50, NULL),
('忄', '竖心旁', 1, 0.35, 0.55, 0.50, NULL),
('禾', '禾字旁', 1, 0.40, 0.55, 0.50, NULL),
('米', '米字旁', 1, 0.40, 0.55, 0.50, NULL),
('耳', '耳字旁', 1, 0.40, 0.55, 0.50, NULL),
('酉', '酉字旁', 1, 0.40, 0.55, 0.50, NULL),
('弓', '弓字旁', 1, 0.35, 0.55, 0.50, NULL),
('戈', '戈字旁', 1, 0.40, 0.50, 0.50, NULL),
('斤', '斤字旁', 1, 0.40, 0.50, 0.50, NULL),
('方', '方字旁', 1, 0.35, 0.55, 0.50, NULL),
('欠', '欠字旁', 1, 0.40, 0.50, 0.45, NULL),
('片', '片字旁', 1, 0.40, 0.50, 0.50, NULL),
('风', '风字旁', 1, 0.45, 0.50, 0.50, NULL),
('飞', '飞字旁', 1, 0.45, 0.50, 0.50, NULL),

-- 常用上下结构部件
('心', '心字底', 1, 0.50, 0.50, 0.65, NULL),
('艹', '草字头', 1, 0.45, 0.50, 0.40, NULL),
('宀', '宝盖头', 1, 0.45, 0.50, 0.40, NULL),
('穴', '穴宝盖', 1, 0.45, 0.50, 0.40, NULL),
('竹', '竹字头', 1, 0.45, 0.50, 0.40, NULL),
('雨', '雨字头', 1, 0.45, 0.50, 0.40, NULL),
('人', '人字头', 1, 0.40, 0.50, 0.40, NULL),
('大', '大字头', 1, 0.40, 0.50, 0.40, NULL),
('山', '山字头', 1, 0.40, 0.50, 0.40, NULL),
('小', '小字头', 1, 0.35, 0.50, 0.40, NULL),
('田', '田字头/底', 1, 0.45, 0.50, 0.50, NULL),
('皿', '皿字底', 1, 0.50, 0.50, 0.60, NULL),
('贝', '贝字底', 1, 0.50, 0.50, 0.55, NULL),
('见', '见字底', 1, 0.50, 0.50, 0.55, NULL),
('走', '走字底', 1, 0.50, 0.50, 0.60, NULL),
('辶', '走之底', 1, 0.50, 0.30, 0.70, NULL),
('廴', '建之旁', 1, 0.50, 0.30, 0.70, NULL),
('子', '子字底', 1, 0.40, 0.50, 0.55, NULL),
('女', '女字底', 1, 0.45, 0.50, 0.55, NULL),
('衣', '衣字底', 1, 0.50, 0.50, 0.60, NULL),

-- 行书变体
('辶_行书简', '走之底(行书简)', 1, 0.50, 0.30, 0.70, '行书简'),
('辶_行书繁', '走之底(行书繁)', 1, 0.50, 0.30, 0.70, '行书繁'),
('心_行书', '心字底(行书)', 1, 0.50, 0.50, 0.65, '行书'),
('马_行书', '马字旁(行书)', 1, 0.35, 0.55, 0.50, '行书'),

-- 繁体/特殊部件
('馬', '馬(繁体)', 0, 0.50, 0.50, 0.50, NULL),
('貝', '貝(繁体)', 0, 0.50, 0.50, 0.55, NULL),
('見', '見(繁体)', 0, 0.50, 0.50, 0.55, NULL),
('車', '車(繁体)', 0, 0.50, 0.50, 0.50, NULL),
('門', '門(繁体)', 0, 0.50, 0.50, 0.50, NULL),
('風', '風(繁体)', 0, 0.50, 0.50, 0.50, NULL),
('長', '長(繁体)', 0, 0.50, 0.50, 0.50, NULL),
('鳥', '鳥(繁体)', 0, 0.50, 0.50, 0.55, NULL),
('魚', '魚(繁体)', 0, 0.50, 0.50, 0.55, NULL),
('韋', '韋(繁体)', 0, 0.50, 0.50, 0.50, NULL),
('頁', '頁(繁体)', 0, 0.50, 0.50, 0.55, NULL),
('飛', '飛(繁体)', 0, 0.50, 0.50, 0.50, NULL),

-- 复杂部件
('耑', '耑', 0, 0.65, 0.50, 0.50, NULL),
('叚', '叚', 0, 0.65, 0.50, 0.50, NULL),
('㐱', '㐱', 0, 0.65, 0.50, 0.50, NULL),
('敬', '敬', 0, 0.55, 0.50, 0.50, NULL),
('而', '而', 0, 0.50, 0.50, 0.50, NULL),
('羊', '羊', 0, 0.50, 0.50, 0.50, NULL),
('彡', '彡', 0, 0.30, 0.70, 0.50, NULL),
('句', '句', 0, 0.50, 0.50, 0.50, NULL),
('攵', '攵', 0, 0.50, 0.50, 0.50, NULL),
('苟', '苟', 0, 0.50, 0.50, 0.50, NULL),
('可', '可', 0, 0.50, 0.50, 0.50, NULL),
('皮', '皮', 0, 0.50, 0.50, 0.50, NULL),
('又', '又', 0, 0.40, 0.50, 0.50, NULL),
('工', '工', 0, 0.40, 0.50, 0.50, NULL);

-- ============================================
-- Seed: Characters (瑞、端、瑕、珍、思、驚、秋)
-- ============================================
INSERT OR IGNORE INTO characters (char, ids, structure, parts_json) VALUES
('瑞', '⿰王耑', 'left-right', '[{"component_id":"王","name":"王字旁","role":"left"},{"component_id":"耑","name":"耑","role":"right"}]'),
('端', '⿰立耑', 'left-right', '[{"component_id":"立","name":"立字旁","role":"left"},{"component_id":"耑","name":"耑","role":"right"}]'),
('瑕', '⿰王叚', 'left-right', '[{"component_id":"王","name":"王字旁","role":"left"},{"component_id":"叚","name":"叚","role":"right"}]'),
('珍', '⿰王㐱', 'left-right', '[{"component_id":"王","name":"王字旁","role":"left"},{"component_id":"㐱","name":"㐱","role":"right"}]'),
('思', '⿱田心', 'top-bottom', '[{"component_id":"田","name":"田字头/底","role":"top"},{"component_id":"心","name":"心字底","role":"bottom"}]'),
('驚', '⿱敬馬', 'top-bottom', '[{"component_id":"敬","name":"敬","role":"top"},{"component_id":"馬","name":"馬(繁体)","role":"bottom"}]'),
('秋', '⿰禾火', 'left-right', '[{"component_id":"禾","name":"禾","role":"left"},{"component_id":"火","name":"火","role":"right"}]');

-- ============================================
-- Seed: Library (楷书 + 行书)
-- ============================================
INSERT OR IGNORE INTO library (char, style, full_image_path, quality_score) VALUES
('瑞', '楷书', 'library/楷书/瑞.png', 0.95),
('瑞', '行书', 'library/行书/瑞.png', 0.88),
('端', '楷书', 'library/楷书/端.png', 0.93),
('端', '行书', 'library/行书/端.png', 0.87),
('瑕', '楷书', 'library/楷书/瑕.png', 0.90),
('瑕', '行书', 'library/行书/瑕.png', 0.85),
('珍', '楷书', 'library/楷书/珍.png', 0.92),
('珍', '行书', 'library/行书/珍.png', 0.86),
('思', '楷书', 'library/楷书/思.png', 0.94),
('思', '行书', 'library/行书/思.png', 0.89),
('驚', '楷书', 'library/楷书/驚.png', 0.91),
('驚', '行书', 'library/行书/驚.png', 0.84);

-- ============================================
-- Seed: Char Parts (倒排关联 + 部件图路径)
-- ============================================
-- 瑞
INSERT OR IGNORE INTO char_parts (char, component_id, role, part_image_path, overlap_pct) VALUES
('瑞', '王', 'left', 'parts/瑞_王.png', 10),
('瑞', '耑', 'right', 'parts/瑞_耑.png', 10);

-- 端
INSERT OR IGNORE INTO char_parts (char, component_id, role, part_image_path, overlap_pct) VALUES
('端', '立', 'left', 'parts/端_立.png', 10),
('端', '耑', 'right', 'parts/端_耑.png', 10);

-- 瑕
INSERT OR IGNORE INTO char_parts (char, component_id, role, part_image_path, overlap_pct) VALUES
('瑕', '王', 'left', 'parts/瑕_王.png', 10),
('瑕', '叚', 'right', 'parts/瑕_叚.png', 10);

-- 珍
INSERT OR IGNORE INTO char_parts (char, component_id, role, part_image_path, overlap_pct) VALUES
('珍', '王', 'left', 'parts/珍_王.png', 10),
('珍', '㐱', 'right', 'parts/珍_㐱.png', 10);

-- 思
INSERT OR IGNORE INTO char_parts (char, component_id, role, part_image_path, overlap_pct) VALUES
('思', '田', 'top', 'parts/思_田.png', 5),
('思', '心', 'bottom', 'parts/思_心.png', 5);

-- 驚
INSERT OR IGNORE INTO char_parts (char, component_id, role, part_image_path, overlap_pct) VALUES
('驚', '敬', 'top', 'parts/驚_敬.png', 5),
('驚', '馬', 'bottom', 'parts/驚_馬.png', 5);

-- 秋
INSERT OR IGNORE INTO char_parts (char, component_id, role, part_image_path, overlap_pct) VALUES
('秋', '禾', 'left', NULL, 0),
('秋', '火', 'right', NULL, 0);
