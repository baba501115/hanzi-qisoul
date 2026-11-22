/**
 * LLM Provider 适配层：统一 OpenAI / Gemini 的多模态调用。
 * 密钥仅从服务端环境变量读取，绝不下发到浏览器。
 */

export type ProviderName = "openai" | "gemini";

export interface GenerateInput {
  system: string;
  user: string;
  /** dataURL（data:image/jpeg;base64,...） */
  imageDataUrl?: string;
}

export interface GenerateResult {
  text: string;
  provider: ProviderName;
}

function env(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : undefined;
}

export function configuredProviders(): ProviderName[] {
  const out: ProviderName[] = [];
  if (env("OPENAI_API_KEY")) out.push("openai");
  if (env("GEMINI_API_KEY")) out.push("gemini");
  return out;
}

function pickProvider(preferred?: string): ProviderName | null {
  const available = configuredProviders();
  if (available.length === 0) return null;
  if (preferred === "openai" && available.includes("openai")) return "openai";
  if (preferred === "gemini" && available.includes("gemini")) return "gemini";
  return available[0];
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!m) return { mimeType: "image/jpeg", base64: dataUrl };
  return { mimeType: m[1], base64: m[2] };
}

async function callOpenAI(input: GenerateInput): Promise<string> {
  const key = env("OPENAI_API_KEY")!;
  const model = env("OPENAI_MODEL") || "gpt-4o-mini";

  const userContent: unknown[] = [{ type: "text", text: input.user }];
  if (input.imageDataUrl) {
    userContent.push({ type: "image_url", image_url: { url: input.imageDataUrl } });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI 调用失败：${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(input: GenerateInput): Promise<string> {
  const key = env("GEMINI_API_KEY")!;
  const model = env("GEMINI_MODEL") || "gemini-1.5-flash";

  const parts: unknown[] = [{ text: input.user }];
  if (input.imageDataUrl) {
    const { mimeType, base64 } = parseDataUrl(input.imageDataUrl);
    parts.push({ inlineData: { mimeType, data: base64 } });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Gemini 调用失败：${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

export async function generate(input: GenerateInput, preferred?: string): Promise<GenerateResult> {
  const provider = pickProvider(preferred);
  if (!provider) throw new Error("NO_PROVIDER");
  const text = provider === "openai" ? await callOpenAI(input) : await callGemini(input);
  return { text, provider };
}

/** 从模型输出中稳健解析 JSON（容忍 ```json 包裹） */
export function parseJSON<T>(text: string): T | null {
  if (!text) return null;
  let s = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(s);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s) as T;
  } catch {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(s.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
