import type { HskCharacter, HskWord } from "@/types";
import charactersRaw from "@/data/characters.json";
import wordsRaw from "@/data/words.json";

// 数据来源：scripts/build-data.mjs 由 hsk-words（HSK 1-3 词表）与
// hanzi-writer-data（笔顺，源自 Make Me a Hanzi）生成，均可查证，不含大模型生成内容。
export const CHARACTERS = charactersRaw as unknown as HskCharacter[];

export const WORDS_BY_LEVEL = wordsRaw as unknown as Record<"1" | "2" | "3", HskWord[]>;

export const CHAR_INDEX: Record<string, HskCharacter> = Object.fromEntries(
  CHARACTERS.map((c) => [c.char, c]),
);

export const ALL_CHARS: string[] = CHARACTERS.map((c) => c.char);

export function getCharacter(char: string): HskCharacter | undefined {
  return CHAR_INDEX[char];
}

export function charsByLevel(level: 1 | 2 | 3): HskCharacter[] {
  return CHARACTERS.filter((c) => c.hskLevel === level);
}

export function searchCharacters(query: string, level?: 0 | 1 | 2 | 3): HskCharacter[] {
  const q = query.trim().toLowerCase();
  return CHARACTERS.filter((c) => {
    if (level && c.hskLevel !== level) return false;
    if (!q) return true;
    return (
      c.char === query.trim() ||
      c.pinyin.toLowerCase().includes(q) ||
      c.meaning.toLowerCase().includes(q) ||
      c.example.word.includes(query.trim())
    );
  });
}

/** 按 HSK 等级顺序推荐尚未学习的新字 */
export function recommendedNewChars(count: number, exclude: Set<string>): HskCharacter[] {
  const out: HskCharacter[] = [];
  for (const c of CHARACTERS) {
    if (out.length >= count) break;
    if (!exclude.has(c.char)) out.push(c);
  }
  return out;
}

export const LEVEL_LABELS: Record<1 | 2 | 3, string> = {
  1: "HSK 1",
  2: "HSK 2",
  3: "HSK 3",
};
