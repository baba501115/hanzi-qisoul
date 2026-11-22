import { useEffect, useState } from "react";
import { BookOpen, Quote, Sparkles, Volume2 } from "lucide-react";
import type { CharFacts, ExplainResponse } from "@/types";
import { explainChar } from "@/services/ai";
import { getLang } from "@/i18n/langs";
import { useStore } from "@/store/useStore";
import { speakChinese } from "@/utils/speech";
import { Card, Pill, Spinner } from "@/components/ui";

export default function ExplainCard({ char, facts }: { char: string; facts: CharFacts | null }) {
  const nativeLang = useStore((s) => s.settings.nativeLang);
  const speechEnabled = useStore((s) => s.settings.speechEnabled);
  const lang = getLang(nativeLang);

  const [data, setData] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setData(null);
    setError(false);
  }, [char, nativeLang]);

  const run = async () => {
    if (!facts) return;
    setLoading(true);
    setError(false);
    try {
      const res = await explainChar(char, nativeLang, facts);
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-cinnabar" />
          <h3 className="section-title text-base">{lang.labels.meaning}</h3>
        </div>
        <button
          type="button"
          onClick={() => speakChinese(char, speechEnabled)}
          className="seal-btn"
          title={lang.labels.listen}
        >
          <Volume2 size={16} />
        </button>
      </div>

      {!data && !loading ? (
        <button type="button" onClick={run} className="btn-primary w-full" disabled={!facts}>
          <Sparkles size={16} />
          {lang.labels.aiExplain}
        </button>
      ) : null}

      {loading ? <Spinner label="…" /> : null}
      {error ? <p className="text-sm text-cinnabar">加载失败，请稍后重试。</p> : null}

      {data ? (
        <div className="space-y-4 animate-ink-reveal">
          <div className="flex items-baseline gap-3">
            <div className="font-hanzi text-5xl leading-none">{char}</div>
            <div>
              <div className="font-display text-xl text-ink-soft">{data.pinyin}</div>
              {data.partOfSpeech ? (
                <div className="text-xs italic text-ink-faint">{data.partOfSpeech}</div>
              ) : null}
            </div>
            <Pill className="ml-auto">
              {data.source === "ai" ? (
                <>
                  <Sparkles size={11} /> AI
                </>
              ) : (
                "offline"
              )}
            </Pill>
          </div>

          <p className="text-[15px] leading-relaxed">{data.meaning}</p>

          {data.components ? (
            <div className="text-sm text-ink-soft">
              <span className="text-ink-faint">{lang.labels.structure}: </span>
              {data.components}
            </div>
          ) : null}

          {data.mnemonic ? (
            <div className="flex gap-2 rounded-card border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
              <Quote size={14} className="mt-0.5 shrink-0 text-gold" />
              <span>{data.mnemonic}</span>
            </div>
          ) : null}

          {data.strokeRules?.length ? (
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
                {lang.labels.strokes}
              </div>
              <ol className="space-y-1">
                {data.strokeRules.map((rule, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-soft">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cinnabar/10 text-[11px] font-medium text-cinnabar">
                      {i + 1}
                    </span>
                    <span>{rule.replace(/^\d+\.\s*/, "")}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {data.example ? (
            <div className="rounded-card border border-black/10 bg-white/50 px-3 py-2">
              <div className="text-xs uppercase tracking-wider text-ink-faint">{lang.labels.example}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-hanzi text-2xl">{data.example.hanzi}</span>
                <span className="text-sm text-ink-soft">{data.example.translation}</span>
              </div>
            </div>
          ) : null}

          {data.source === "offline" ? (
            <p className="text-xs text-ink-faint">{lang.labels.offlineNote}</p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
