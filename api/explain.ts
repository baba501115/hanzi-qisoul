import { generate, parseJSON, configuredProviders } from "./_lib/providers";
import {
  buildExplainPrompt,
  buildExplainRepairPrompt,
  ExplainSchema,
  type CharFactsLike,
  type NativeLang,
} from "./_lib/prompt";

/**
 * POST /api/explain
 * 用学习者母语解释字义与笔顺规则。笔顺事实由前端从可查证字库生成并注入，
 * 模型被严格约束不得修改/编造笔顺。
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

  const { char, nativeLang, facts, provider } = (req.body ?? {}) as {
    char?: string;
    nativeLang?: NativeLang;
    facts?: CharFactsLike;
    provider?: string;
  };

  if (!char || !facts || !Array.isArray(facts.strokes)) {
    res.status(400).json({ error: "char 与 facts 为必填项" });
    return;
  }

  const lang: NativeLang = nativeLang ?? "en";
  const { system, user } = buildExplainPrompt(char, lang, facts);

  try {
    let { text } = await generate({ system, user }, provider);
    let parsed = parseJSON<unknown>(text);
    let result = parsed ? ExplainSchema.safeParse(parsed) : null;

    if (!result || !result.success) {
      // 一次修复尝试
      const repaired = await generate(
        { system, user: `${user}\n\n${buildExplainRepairPrompt()}` },
        provider,
      );
      text = repaired.text;
      parsed = parseJSON<unknown>(text);
      result = parsed ? ExplainSchema.safeParse(parsed) : null;
    }

    if (!result || !result.success) {
      res.status(502).json({ error: "模型返回格式无法解析" });
      return;
    }

    const data = result.data;
    res.status(200).json({
      pinyin: data.pinyin,
      meaning: data.meaning,
      partOfSpeech: data.partOfSpeech,
      components: data.components,
      mnemonic: data.mnemonic,
      strokeRules: data.strokeRules,
      example: data.example,
      grounded: true,
      source: "ai",
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "模型调用失败" });
  }
}
