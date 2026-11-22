// 构建期数据生成脚本
// 数据来源（均可查证，禁止大模型生成）：
//   1. HSK 1-3 词表：hsk-words 包内的 SQLite 数据库（level / simplified / pronunciation / definitions）
//   2. 笔顺数据：hanzi-writer-data 包（源自 Make Me a Hanzi / Arphic Public License）
// 产物：
//   src/data/characters.json     HSK 1-3 去重汉字（含拼音、英文释义、笔画数、示例词）
//   src/data/words.json          HSK 1-3 词表（分级）
//   public/data/strokes.json     每个字的笔画路径与中线点集（供 Hanzi-Writer 与评测使用）
// 运行：node --experimental-sqlite scripts/build-data.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pnpmDir = path.join(root, "node_modules/.pnpm");

function findPkgDir(name) {
  const dir = fs.readdirSync(pnpmDir).find((d) => d.startsWith(`${name}@`));
  if (!dir) throw new Error(`未找到依赖：${name}`);
  return path.join(pnpmDir, dir, "node_modules", name);
}

const hskWordsDir = findPkgDir("hsk-words");
const hanziDataDir = findPkgDir("hanzi-writer-data");
const sqlitePath = path.join(hskWordsDir, "db/hsk-words.sqlite");

const MAX_LEVEL = 3;

// —— 数字声调 → 声调符号 ——
const toneMap = {
  a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", v: "ǖǘǚǜ", ü: "ǖǘǚǜ",
};
function numberedToMarked(syllable) {
  const m = syllable.match(/^([a-zA-Zü]+)(\d)?$/);
  if (!m) return syllable;
  let base = m[1].toLowerCase();
  const tone = m[2] ? Number(m[2]) : 0;
  if (!tone || tone === 5) return base.replace(/v/g, "ü");
  const vowels = "aeiouü";
  let idx = -1;
  if (base.includes("a")) idx = base.indexOf("a");
  else if (base.includes("o")) idx = base.indexOf("o");
  else if (base.includes("e")) idx = base.indexOf("e");
  else if (/iu/.test(base)) idx = base.indexOf("u");
  else if (/ui/.test(base)) idx = base.indexOf("i");
  else {
    for (let i = base.length - 1; i >= 0; i--) {
      if (vowels.includes(base[i])) { idx = i; break; }
    }
  }
  if (idx < 0) return base.replace(/v/g, "ü");
  const v = base[idx];
  const table = toneMap[v] || toneMap[v.replace("ü", "v")];
  if (!table) return base.replace(/v/g, "ü");
  const marked = table[tone - 1];
  return (base.slice(0, idx) + marked + base.slice(idx + 1)).replace(/v/g, "ü");
}
function markedPinyin(pronunciation) {
  return pronunciation.split(/\s+/).filter(Boolean).map(numberedToMarked).join(" ");
}

// —— 读取 HSK 词表 ——
const db = new DatabaseSync(sqlitePath);
const rows = db.prepare("SELECT level, simplified, pronunciation, definitions FROM Words WHERE level <= ? ORDER BY level, id").all(MAX_LEVEL);
db.close();

function cleanDefinition(def) {
  let d = String(def || "").split(/;|,|\|/)[0].trim();
  d = d.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();
  if (d.length > 60) d = d.slice(0, 57).trim() + "…";
  return d || "";
}

/** word -> 分级词条目 */
const wordsByLevel = { 1: [], 2: [], 3: [] };
/** char -> 聚合信息 */
const charMap = new Map();

for (const r of rows) {
  const word = String(r.simplified).trim();
  const level = Number(r.level);
  const syllables = String(r.pronunciation || "").split(/\s+/).filter(Boolean);
  const meaning = cleanDefinition(r.definitions);
  const entry = { word, pinyin: markedPinyin(r.pronunciation || ""), meaning, level };
  wordsByLevel[level].push(entry);

  const chars = Array.from(word);
  if (chars.length !== syllables.length) {
    // 音节数与字数不一致时，仍按位置尽力对齐
  }
  chars.forEach((ch, i) => {
    if (!/[\u4e00-\u9fff]/.test(ch)) return;
    const syl = syllables[i] || syllables[0] || "";
    const prev = charMap.get(ch);
    const isBetterPinyin = syl && (!prev || !prev.pinyin);
    const isShorterWord = !prev || chars.length < prev.wordLen;
    if (!prev) {
      charMap.set(ch, {
        char: ch, hskLevel: level, pinyin: markedPinyin(syl),
        wordLen: chars.length, example: entry,
      });
    } else {
      prev.hskLevel = Math.min(prev.hskLevel, level);
      if (isBetterPinyin) prev.pinyin = markedPinyin(syl);
      if (isShorterWord) { prev.wordLen = chars.length; prev.example = entry; }
    }
  });
}
// wordLen 仅用于内部排序，移除
for (const v of charMap.values()) delete v.wordLen;

// —— 合并笔顺数据 ——
const strokes = {};
const characters = [];
let missing = 0;
for (const c of charMap.values()) {
  const file = path.join(hanziDataDir, `${c.char}.json`);
  if (!fs.existsSync(file)) { missing++; continue; }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  strokes[c.char] = { strokes: data.strokes, medians: data.medians };
  characters.push({
    char: c.char,
    hskLevel: c.hskLevel,
    pinyin: c.pinyin,
    meaning: c.example.meaning,
    strokeCount: data.strokes.length,
    example: { word: c.example.word, pinyin: c.example.pinyin, meaning: c.example.meaning },
  });
}
characters.sort((a, b) => a.hskLevel - b.hskLevel || a.strokeCount - b.strokeCount);

const outDir = path.join(root, "src/data");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "characters.json"), JSON.stringify(characters));
fs.writeFileSync(path.join(outDir, "words.json"), JSON.stringify(wordsByLevel));

const publicData = path.join(root, "public/data");
fs.mkdirSync(publicData, { recursive: true });
fs.writeFileSync(path.join(publicData, "strokes.json"), JSON.stringify(strokes));

console.log(`HSK 词表：L1=${wordsByLevel[1].length} L2=${wordsByLevel[2].length} L3=${wordsByLevel[3].length}`);
console.log(`汉字：${characters.length} 个（缺少笔顺数据被跳过：${missing}）`);
console.log(`笔顺数据已写入 public/data/strokes.json（${(fs.statSync(path.join(publicData, "strokes.json")).size / 1024 / 1024).toFixed(2)} MB）`);
