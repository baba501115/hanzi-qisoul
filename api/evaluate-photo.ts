import { generate, parseJSON, configuredProviders } from "./_lib/providers";
import {
  buildPhotoPrompt,
  PhotoSchema,
  type CharFactsLike,
  type NativeLang,
} from "./_lib/prompt";

/**
 * POST /api/evaluate-photo
 * 多模态大模型评测手写整字（结构 / 笔画 / 建议），反馈语言跟随学习者母语。
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  if (configuredProviders().length === 0) {
    res.status(501).json({ error: "No LLM provider configured" });
    return;
  }

  const { imageBase64, expectedChar, nativeLang, facts, provider } = (req.body ?? {}) as {
    imageBase64?: string;
    expectedChar?: string;
    nativeLang?: NativeLang;
    facts?: CharFactsLike | null;
    provider?: string;
  };

  if (!imageBase64 || !imageBase64.startsWith("data:image")) {
    res.status(400).json({ error: "imageBase64 必须为 dataURL" });
    return;
  }

  const lang: NativeLang = nativeLang ?? "en";
  const { system, user } = buildPhotoPrompt(lang, expectedChar, facts);

  try {
    const { text } = await generate({ system, user, imageDataUrl: imageBase64 }, provider);
    const parsed = parseJSON<unknown>(text);
    const result = parsed ? PhotoSchema.safeParse(parsed) : null;

    if (!result || !result.success) {
      res.status(502).json({ error: "模型返回格式无法解析" });
      return;
    }

    const data = result.data;
    res.status(200).json({
      recognizedChar: data.recognizedChar,
      isMatch: data.isMatch,
      overallScore: Math.max(0, Math.min(100, Math.round(data.overallScore))),
      structureIssues: data.structureIssues,
      strokeIssues: data.strokeIssues,
      suggestions: data.suggestions,
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "模型调用失败" });
  }
}
