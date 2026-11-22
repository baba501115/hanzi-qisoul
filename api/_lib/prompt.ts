import { z } from "zod";

export type NativeLang = "en" | "th" | "vi" | "es" | "fr" | "ja";

export const LANG_NAMES: Record<NativeLang, string> = {
  en: "English",
  th: "Thai (ไทย)",
  vi: "Vietnamese (Tiếng Việt)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  ja: "Japanese (日本語)",
};

export interface StrokeFactLike {
  index: number;
  typeLabel: string;
  direction: string;
  startPoint: [number, number];
  endPoint: [number, number];
}

export interface CharFactsLike {
  char: string;
  strokeCount: number;
  strokes: StrokeFactLike[];
  dataSource: string;
}

export const ExplainSchema = z.object({
  pinyin: z.string(),
  meaning: z.string(),
  partOfSpeech: z.string().optional(),
  components: z.string().optional(),
  mnemonic: z.string().optional(),
  strokeRules: z.array(z.string()).default([]),
  example: z
    .object({ hanzi: z.string(), translation: z.string() })
    .optional(),
});

export const PhotoSchema = z.object({
  recognizedChar: z.string(),
  isMatch: z.boolean(),
  overallScore: z.number(),
  structureIssues: z.array(z.string()).default([]),
  strokeIssues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
});

function factsBlock(facts: CharFactsLike): string {
  const lines = facts.strokes.map(
    (s) =>
      `- stroke ${s.index}: name="${s.typeLabel}", direction="${s.direction}", start=[${s.startPoint}] end=[${s.endPoint}]`,
  );
  return [
    `char: ${facts.char}`,
    `strokeCount: ${facts.strokeCount}`,
    `dataSource: ${facts.dataSource}`,
    "strokes:",
    ...lines,
  ].join("\n");
}

const GROUNDING_RULE =
  "CRITICAL RULE: The stroke order facts below are the ONLY source of truth for stroke information. " +
  "You MUST NOT invent, add, reorder, merge or modify any stroke. If you are unsure, simply restate the given facts. " +
  "The number of strokes and their order/names must exactly match the provided facts.";

export function buildExplainPrompt(
  char: string,
  lang: NativeLang,
  facts: CharFactsLike,
): { system: string; user: string } {
  const langName = LANG_NAMES[lang] ?? "English";
  const system = [
    "You are a friendly Chinese character writing coach for foreign learners.",
    `Write ALL of your output in ${langName}.`,
    GROUNDING_RULE,
    "Output ONLY a single JSON object, no markdown, matching exactly this shape:",
    `{"pinyin": string, "meaning": string, "partOfSpeech": string, "components": string, "mnemonic": string, "strokeRules": string[], "example": {"hanzi": string, "translation": string}}`,
    "Rules for content:",
    "- pinyin: pinyin with tone marks.",
    "- meaning: the meaning of the character in the learner's language.",
    "- components: brief structural/radical analysis (in the learner's language), optional.",
    "- mnemonic: a short memorable hook in the learner's language, optional.",
    "- strokeRules: one short sentence PER stroke, in the learner's language, describing how to write that stroke and its direction; must correspond one-to-one with the provided strokes in the SAME order.",
    "- example: a common word containing the character plus its translation, optional.",
  ].join("\n");

  const user = [
    "Here are the verified stroke facts (source of truth):",
    factsBlock(facts),
    "",
    `Now produce the JSON for the character "${char}".`,
  ].join("\n");

  return { system, user };
}

export function buildExplainRepairPrompt(): string {
  return "Your previous answer was not valid JSON matching the required shape. Reply again with ONLY the JSON object.";
}

export function buildPhotoPrompt(
  lang: NativeLang,
  expectedChar?: string,
  facts?: CharFactsLike | null,
): { system: string; user: string } {
  const langName = LANG_NAMES[lang] ?? "English";
  const system = [
    "You are a Chinese handwriting evaluator. You receive a photo of a hand-written Chinese character.",
    `Write ALL feedback text in ${langName}.`,
    "Analyze the writing and return ONLY a JSON object, no markdown, matching exactly this shape:",
    `{"recognizedChar": string, "isMatch": boolean, "overallScore": number, "structureIssues": string[], "strokeIssues": string[], "suggestions": string[]}`,
    "Rules:",
    "- recognizedChar: the single character you believe is written.",
    expectedChar
      ? `- expectedChar is "${expectedChar}"; isMatch=true only if the writing matches it.`
      : "- isMatch: true (no expected character provided).",
    "- overallScore: integer 0-100 judging legibility and correctness.",
    "- structureIssues: issues about balance, proportion, spacing (in the learner's language).",
    "- strokeIssues: stroke-level issues (in the learner's language). If verified stroke facts are provided, judge stroke composition against them and DO NOT invent stroke order.",
    "- suggestions: concrete improvement tips (in the learner's language).",
    GROUNDING_RULE,
  ].join("\n");

  const parts = [
    "Evaluate the hand-written character in the image.",
    expectedChar ? `The learner was asked to write: "${expectedChar}".` : "",
    facts ? `Verified stroke facts for reference:\n${factsBlock(facts)}` : "",
  ].filter(Boolean);

  return { system, user: parts.join("\n\n") };
}
