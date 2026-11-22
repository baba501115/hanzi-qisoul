export type NativeLang = "en" | "th" | "vi" | "es" | "fr" | "ja";

export type Direction =
  | "horizontal"
  | "vertical"
  | "left-falling"
  | "right-falling"
  | "dot"
  | "turn";

export type StrokeDirection = Direction;

export interface HskCharacter {
  char: string;
  hskLevel: 1 | 2 | 3;
  pinyin: string;
  meaning: string;
  strokeCount: number;
  example: { word: string; pinyin: string; meaning: string };
}

export interface HskWord {
  word: string;
  pinyin: string;
  meaning: string;
  level: number;
}

/** 单笔的「可查证事实」，由笔顺数据几何推导，不涉及大模型 */
export interface StrokeFact {
  index: number;
  typeLabel: string;
  direction: StrokeDirection;
  startPoint: [number, number];
  endPoint: [number, number];
}

export interface CharFacts {
  char: string;
  strokeCount: number;
  strokes: StrokeFact[];
  dataSource: "hanzi-writer-data";
}

export interface StrokeData {
  strokes: string[];
  medians: [number, number][][];
}

/** SM-2 记忆状态 */
export interface SM2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: string;
}

export type ReviewRating = 0 | 1 | 2; // 忘记 / 模糊 / 认识

export interface ReviewItem extends SM2State {
  char: string;
  mastery: number; // 0-5
  lastRating?: ReviewRating;
  lastReviewed?: string;
  reviews: number;
}

export interface PracticeAttempt {
  id: string;
  char: string;
  mode: "trace" | "write" | "camera";
  score: number;
  createdAt: string;
}

export interface Profile {
  id: string;
  nativeLang: NativeLang;
  streakDays: number;
  totalPracticed: number;
  createdAt: string;
  lastPracticeDate?: string;
}

export interface Settings {
  nativeLang: NativeLang;
  speechEnabled: boolean;
  evalMode: "trace" | "write";
  aiProvider: "auto" | "openai" | "gemini";
}

/* ---------- 评测结果 ---------- */

export interface StrokeScore {
  index: number;
  score: number;
  directionOk: boolean;
  startOk: boolean;
  matched: boolean;
}

export interface EvaluationResult {
  overall: number;
  strokes: StrokeScore[];
  missing: number[];
  extra: number[];
  orderOk: boolean;
}

/* ---------- AI 服务 ---------- */

export interface ExplainResponse {
  pinyin: string;
  meaning: string;
  partOfSpeech?: string;
  components?: string;
  mnemonic?: string;
  strokeRules: string[];
  example?: { hanzi: string; translation: string };
  grounded: boolean;
  source: "ai" | "offline";
}

export interface EvaluatePhotoResponse {
  recognizedChar: string;
  isMatch: boolean;
  overallScore: number;
  structureIssues: string[];
  strokeIssues: string[];
  suggestions: string[];
}

export interface HealthResponse {
  ok: boolean;
  providersConfigured: string[];
}
