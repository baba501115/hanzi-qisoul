import type { NativeLang } from "@/types";

export interface LangMeta {
  code: NativeLang;
  /** 该语言的母语名称 */
  nativeName: string;
  /** 中文名称 */
  zhName: string;
  englishName: string;
  /** 讲解卡标题等 UI 文案（母语） */
  labels: {
    meaning: string;
    strokes: string;
    mnemonic: string;
    example: string;
    structure: string;
    suggestions: string;
    practice: string;
    listen: string;
    aiExplain: string;
    offlineNote: string;
  };
}

export const LANGUAGES: LangMeta[] = [
  {
    code: "en",
    nativeName: "English",
    zhName: "英语",
    englishName: "English",
    labels: {
      meaning: "Meaning",
      strokes: "Stroke order",
      mnemonic: "Memory hook",
      example: "Example",
      structure: "Structure",
      suggestions: "Suggestions",
      practice: "Practice writing",
      listen: "Listen",
      aiExplain: "Explain in my language",
      offlineNote: "Offline explanation — connect an AI model for richer notes.",
    },
  },
  {
    code: "th",
    nativeName: "ไทย",
    zhName: "泰语",
    englishName: "Thai",
    labels: {
      meaning: "ความหมาย",
      strokes: "ลำดับขีด",
      mnemonic: "เทคนิคจำ",
      example: "ตัวอย่าง",
      structure: "โครงสร้าง",
      suggestions: "คำแนะนำ",
      practice: "ฝึกเขียน",
      listen: "ฟังเสียง",
      aiExplain: "อธิบายเป็นภาษาไทย",
      offlineNote: "คำอธิบายออฟไลน์ — เชื่อมต่อโมเดล AI เพื่อคำอธิบายที่ละเอียดขึ้น",
    },
  },
  {
    code: "vi",
    nativeName: "Tiếng Việt",
    zhName: "越南语",
    englishName: "Vietnamese",
    labels: {
      meaning: "Nghĩa",
      strokes: "Thứ tự nét",
      mnemonic: "Mẹo nhớ",
      example: "Ví dụ",
      structure: "Cấu trúc",
      suggestions: "Gợi ý",
      practice: "Luyện viết",
      listen: "Nghe",
      aiExplain: "Giải thích bằng tiếng Việt",
      offlineNote: "Giải thích ngoại tuyến — hãy kết nối mô hình AI để có nội dung phong phú hơn.",
    },
  },
  {
    code: "es",
    nativeName: "Español",
    zhName: "西班牙语",
    englishName: "Spanish",
    labels: {
      meaning: "Significado",
      strokes: "Orden de trazos",
      mnemonic: "Truco para recordar",
      example: "Ejemplo",
      structure: "Estructura",
      suggestions: "Sugerencias",
      practice: "Practicar escritura",
      listen: "Escuchar",
      aiExplain: "Explicar en español",
      offlineNote: "Explicación sin conexión — conecta un modelo de IA para notas más completas.",
    },
  },
  {
    code: "fr",
    nativeName: "Français",
    zhName: "法语",
    englishName: "French",
    labels: {
      meaning: "Signification",
      strokes: "Ordre des traits",
      mnemonic: "Astuce mémo",
      example: "Exemple",
      structure: "Structure",
      suggestions: "Conseils",
      practice: "S'entraîner à écrire",
      listen: "Écouter",
      aiExplain: "Expliquer en français",
      offlineNote: "Explication hors ligne — connectez un modèle d'IA pour des notes plus riches.",
    },
  },
  {
    code: "ja",
    nativeName: "日本語",
    zhName: "日语",
    englishName: "Japanese",
    labels: {
      meaning: "意味",
      strokes: "筆順",
      mnemonic: "覚え方",
      example: "例",
      structure: "構成",
      suggestions: "アドバイス",
      practice: "書き取り練習",
      listen: "聞く",
      aiExplain: "日本語で説明",
      offlineNote: "オフライン解説 — AI モデルを接続すると詳しい説明が得られます。",
    },
  },
];

export const LANG_MAP: Record<NativeLang, LangMeta> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l]),
) as Record<NativeLang, LangMeta>;

export function getLang(code: NativeLang): LangMeta {
  return LANG_MAP[code] ?? LANG_MAP.en;
}
