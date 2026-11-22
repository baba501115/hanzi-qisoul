import type {
  CharFacts,
  EvaluatePhotoResponse,
  ExplainResponse,
  HealthResponse,
  NativeLang,
  StrokeDirection,
} from "@/types";
import { getCharacter } from "@/data/hsk";
import { getLang } from "@/i18n/langs";

const DIR_EN: Record<StrokeDirection, string> = {
  horizontal: "horizontal (from left to right)",
  vertical: "vertical (from top to bottom)",
  "left-falling": "left-falling (撇, from top-right to bottom-left)",
  "right-falling": "right-falling (捺, from top-left to bottom-right)",
  dot: "dot (点)",
  turn: "turn/hook (折/钩, written in one continuous motion)",
};

export function buildOfflineExplain(
  char: string,
  nativeLang: NativeLang,
  facts: CharFacts,
): ExplainResponse {
  const meta = getLang(nativeLang);
  const record = getCharacter(char);
  const pinyin = record?.pinyin ?? "";
  const meaning = record?.meaning ?? "";
  const strokeRules = facts.strokes.map(
    (s, i) => `${i + 1}. 第 ${s.index} 笔「${s.typeLabel}」— ${DIR_EN[s.direction]}`,
  );
  return {
    pinyin,
    meaning,
    partOfSpeech: record?.example?.meaning ? undefined : undefined,
    components: `${facts.strokeCount} ${meta.labels.strokes.toLowerCase()}`,
    mnemonic: undefined,
    strokeRules,
    example: record
      ? { hanzi: record.example.word, translation: record.example.meaning }
      : undefined,
    grounded: true,
    source: "offline",
  };
}

async function postJSON<T>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    const data = (await res.json()) as T;
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export async function getHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export async function explainChar(
  char: string,
  nativeLang: NativeLang,
  facts: CharFacts,
  provider?: string,
): Promise<ExplainResponse> {
  const res = await postJSON<ExplainResponse>("/api/explain", {
    char,
    nativeLang,
    facts,
    provider: provider && provider !== "auto" ? provider : undefined,
  });
  if (res.ok && res.data) return { ...res.data, source: "ai" };
  // 服务端未配置密钥（501）或不可用时，降级为内置离线讲解
  return buildOfflineExplain(char, nativeLang, facts);
}

export async function evaluatePhoto(
  imageBase64: string,
  expectedChar: string | undefined,
  nativeLang: NativeLang,
  facts: CharFacts | undefined,
  provider?: string,
): Promise<EvaluatePhotoResponse | null> {
  const res = await postJSON<EvaluatePhotoResponse>("/api/evaluate-photo", {
    imageBase64,
    expectedChar,
    nativeLang,
    facts,
    provider: provider && provider !== "auto" ? provider : undefined,
  });
  if (res.ok && res.data) return res.data;
  return null;
}
