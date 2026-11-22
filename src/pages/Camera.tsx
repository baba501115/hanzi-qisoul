import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera as CameraIcon, ImageUp, PenLine, Sparkles, X } from "lucide-react";
import { Card, Pill, ScoreRing, SectionTitle, Spinner } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { buildStrokeFacts, getStrokeData } from "@/utils/strokes";
import { getCharacter, recommendedNewChars } from "@/data/hsk";
import { compressImage } from "@/utils/image";
import { evaluatePhoto } from "@/services/ai";
import type { EvaluatePhotoResponse } from "@/types";

export default function Camera() {
  const nativeLang = useStore((s) => s.settings.nativeLang);
  const reviewItems = useStore((s) => s.reviewItems);
  const recordAttempt = useStore((s) => s.recordAttempt);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [expected, setExpected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluatePhotoResponse | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const candidates = useMemo(() => {
    const used = Object.keys(reviewItems);
    if (used.length >= 6) return used.slice(0, 30);
    return [...used, ...recommendedNewChars(12, new Set(used)).map((c) => c.char)];
  }, [reviewItems]);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setResult(null);
    setUnavailable(false);
    const dataUrl = await compressImage(file);
    setPreview(dataUrl);
  };

  const submit = async () => {
    if (!preview) return;
    setLoading(true);
    setResult(null);
    setUnavailable(false);
    try {
      let facts;
      if (expected) {
        const data = await getStrokeData(expected);
        if (data) facts = buildStrokeFacts(expected, data);
      }
      const res = await evaluatePhoto(preview, expected || undefined, nativeLang, facts);
      if (res) {
        setResult(res);
        if (expected) recordAttempt(expected, "camera", res.overallScore);
      } else {
        setUnavailable(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setUnavailable(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <Card>
        <h1 className="font-display text-2xl font-600">拍照评测</h1>
        <p className="mt-1 text-sm text-ink-soft">
          拍摄或上传你手写的整字，由多模态大模型识别并给出结构与书写反馈。反馈语言：跟随「设置」中的母语。
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <SectionTitle
            title="上传手写"
            action={
              preview ? (
                <button type="button" className="seal-btn" onClick={reset} title="移除">
                  <X size={16} />
                </button>
              ) : null
            }
          />

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border border-dashed border-black/25 bg-white/40 py-10 text-center transition-colors hover:border-cinnabar/50">
            <ImageUp size={28} className="text-cinnabar" />
            <span className="text-sm text-ink-soft">点击拍摄或选择图片</span>
            <span className="text-xs text-ink-faint">建议在田字格或白纸上写单个大字</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
          </label>

          {preview ? (
            <div className="overflow-hidden rounded-card border border-black/10 bg-white/60 p-2">
              <img src={preview} alt="手写预览" className="mx-auto max-h-72 rounded-lg" />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-ink-faint">目标汉字</span>
              <select
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                className="rounded-lg border border-black/15 bg-white/70 px-3 py-1.5 text-sm outline-none focus:border-cinnabar/50"
              >
                <option value="">不指定（仅识别）</option>
                {candidates.map((c) => (
                  <option key={c} value={c}>
                    {c} {getCharacter(c)?.pinyin ?? ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn-primary ml-auto"
              onClick={submit}
              disabled={!preview || loading}
            >
              <Sparkles size={16} /> 提交评测
            </button>
          </div>

          {loading ? <Spinner label="正在评测…" /> : null}
          {unavailable ? (
            <div className="rounded-card border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink-soft">
              服务端未配置多模态模型密钥，拍照评测暂不可用。请在 Vercel 环境变量中设置{" "}
              <code>OPENAI_API_KEY</code> 或 <code>GEMINI_API_KEY</code> 后重试。
              田字格手写评测与 SM-2 复习不受影响。
            </div>
          ) : null}
        </Card>

        <Card>
          <SectionTitle title="评测结果" hint="结构与笔画问题会以你的母语给出" />
          {!result ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-ink-faint">
              <CameraIcon size={26} className="text-ash" />
              提交后在此查看识别结果与改进建议。
            </div>
          ) : (
            <div className="space-y-4 animate-ink-reveal">
              <div className="flex items-center gap-5">
                <ScoreRing score={result.overallScore} label="Score" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink-faint">识别到</div>
                  <div className="font-hanzi text-4xl">{result.recognizedChar}</div>
                  <div className="mt-1 flex gap-2">
                    <Pill
                      className={
                        result.isMatch ? "border-jade/50 text-jade" : "border-cinnabar/40 text-cinnabar"
                      }
                    >
                      {result.isMatch ? "与目标一致" : "与目标不一致"}
                    </Pill>
                  </div>
                </div>
              </div>

              {[
                { title: "结构问题", items: result.structureIssues },
                { title: "笔画问题", items: result.strokeIssues },
                { title: "改进建议", items: result.suggestions },
              ].map((g) =>
                g.items?.length ? (
                  <div key={g.title}>
                    <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
                      {g.title}
                    </div>
                    <ul className="space-y-1">
                      {g.items.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-ink-soft">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cinnabar/70" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}

              {expected ? (
                <Link to={`/practice/${encodeURIComponent(expected)}`} className="btn-ink w-full">
                  <PenLine size={16} /> 去田字格重新练习
                </Link>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
