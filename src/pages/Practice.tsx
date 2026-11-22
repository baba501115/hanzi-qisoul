import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eraser,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  Sparkles,
  Undo2,
} from "lucide-react";
import GridCanvas, { type GridCanvasHandle } from "@/components/GridCanvas";
import StrokeFactsList from "@/components/StrokeFactsList";
import ExplainCard from "@/components/ExplainCard";
import { Card, ScoreRing, SectionTitle, scoreTone } from "@/components/ui";
import { useFacts } from "@/hooks/useFacts";
import { useStore } from "@/store/useStore";
import { getCharacter, charsByLevel, ALL_CHARS } from "@/data/hsk";
import type { EvaluationResult } from "@/types";
import { speakChinese } from "@/utils/speech";
import { cn } from "@/lib/utils";

const RATINGS: { value: 0 | 1 | 2; label: string; hint: string; className: string }[] = [
  { value: 2, label: "认识", hint: "记得很牢", className: "btn-ink" },
  { value: 1, label: "模糊", hint: "有点犹豫", className: "btn-ghost" },
  { value: 0, label: "忘记", hint: "完全想不起来", className: "btn-primary" },
];

export default function Practice() {
  const { char: rawChar } = useParams<{ char: string }>();
  const char = rawChar ? decodeURIComponent(rawChar) : "";
  const navigate = useNavigate();

  const ensureItem = useStore((s) => s.ensureItem);
  const recordAttempt = useStore((s) => s.recordAttempt);
  const rateChar = useStore((s) => s.rateChar);
  const item = useStore((s) => s.reviewItems[char]);
  const speechEnabled = useStore((s) => s.settings.speechEnabled);
  const speechEnabledResolved = speechEnabled;
  const defaultEvalMode = useStore((s) => s.settings.evalMode);

  const facts = useFacts(char);
  const canvasRef = useRef<GridCanvasHandle | null>(null);
  const [outline, setOutline] = useState(defaultEvalMode === "trace");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);
  const [rated, setRated] = useState(false);
  const [size, setSize] = useState(340);

  const record = useMemo(() => getCharacter(char), [char]);

  /* 画布尺寸自适应 */
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      const s = w < 480 ? Math.min(w - 48, 360) : w < 1024 ? 340 : 380;
      setSize(Math.max(240, s));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  /* 进入练字即为该字建档 */
  useEffect(() => {
    if (char) ensureItem(char);
  }, [char, ensureItem]);

  /* 切换汉字时重置状态 */
  useEffect(() => {
    setResult(null);
    setStrokeCount(0);
    setRated(false);
    setOutline(defaultEvalMode === "trace");
  }, [char, defaultEvalMode]);

  /* 导航：同级别内上一个/下一个 */
  const siblings = useMemo(() => {
    if (!record) return ALL_CHARS;
    return charsByLevel(record.hskLevel).map((c) => c.char);
  }, [record]);
  const idx = siblings.indexOf(char);
  const prev = idx > 0 ? siblings[idx - 1] : undefined;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : undefined;

  const handleEvaluate = () => {
    const r = canvasRef.current?.evaluate();
    if (!r) return;
    setResult(r);
    setRated(false);
    recordAttempt(char, outline ? "trace" : "write", r.overall);
    notifyGame(char);
  };

  const handleRate = (value: 0 | 1 | 2) => {
    rateChar(char, value);
    setRated(true);
  };

  const notifyGame = (practicedChar: string) => {
    try {
      const key = "hanziflow.gameBridge";
      const raw = localStorage.getItem(key);
      const bridge = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        key,
        JSON.stringify({
          ...bridge,
          char: practicedChar,
          completedAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* 同步失败不影响练字主流程 */
    }
  };

  const tone = result ? scoreTone(result.overall) : null;

  if (!char) {
    return <p className="p-6 text-ink-faint">缺少汉字参数。</p>;
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link to="/practice" className="btn-ghost">
          <ArrowLeft size={16} /> 练字队列
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="font-hanzi text-3xl">{char}</span>
          {record ? (
            <>
              <span className="font-display text-lg text-ink-soft">{record.pinyin}</span>
              <span className="hidden text-sm text-ink-faint sm:inline">{record.meaning}</span>
            </>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => speakChinese(char, speechEnabledResolved)}
          className="seal-btn ml-auto"
          title="朗读"
        >
          <Sparkles size={15} />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* 左：画布与操作 */}
        <div className="space-y-4">
          <Card className="flex flex-col items-center gap-4 py-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" className="btn-ink" onClick={() => canvasRef.current?.play()}>
                <Play size={16} /> 演示笔顺
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setOutline((v) => !v)}
                title="切换描红底稿"
              >
                {outline ? <EyeOff size={16} /> : <Eye size={16} />}
                {outline ? "关闭描红" : "显示描红"}
              </button>
            </div>

            <GridCanvas
              ref={canvasRef}
              char={char}
              size={size}
              outline={outline}
              autoPlay
              onResult={setResult}
              onChange={setStrokeCount}
            />

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" className="btn-ghost" onClick={() => canvasRef.current?.undo()}>
                <Undo2 size={16} /> 撤销
              </button>
              <button type="button" className="btn-ghost" onClick={() => canvasRef.current?.clear()}>
                <Eraser size={16} /> 清空
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => canvasRef.current?.showHint()}
              >
                <Eye size={16} /> 提示
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleEvaluate}
                disabled={strokeCount === 0}
              >
                <Check size={16} /> 检查笔顺
              </button>
            </div>
            <p className="text-xs text-ink-faint">
              已写 {strokeCount} 笔{facts ? ` / 共 ${facts.strokeCount} 笔` : ""}。在田字格内书写，点「检查笔顺」查看逐笔评分。
            </p>
          </Card>

          {/* 评测结果 */}
          {result ? (
            <Card className="animate-fade-up">
              <SectionTitle
                title="评测结果"
                hint={
                  result.orderOk
                    ? "笔序正确"
                    : "检测到笔序可能不正确，留意下方提示"
                }
              />
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <ScoreRing score={result.overall} label={tone?.label} />
                <div className="w-full flex-1 space-y-2">
                  <div className="grid gap-1.5">
                    {result.strokes.map((s) => {
                      const t = scoreTone(s.score);
                      return (
                        <div key={s.index} className="flex items-center gap-2 text-xs">
                          <span className="w-8 shrink-0 text-ink-faint">第{s.index}笔</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                            <div
                              className="h-full rounded-full transition-[width] duration-500"
                              style={{ width: `${s.score}%`, backgroundColor: t.color }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-right" style={{ color: t.color }}>
                            {s.score}
                          </span>
                          {!s.directionOk ? <span className="text-cinnabar">方向</span> : null}
                          {!s.startOk ? <span className="text-gold">起笔</span> : null}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1 text-xs">
                    {result.missing.length > 0 ? (
                      <span className="pill border-cinnabar/40 text-cinnabar">
                        缺 {result.missing.join("、")} 笔
                      </span>
                    ) : null}
                    {result.extra.length > 0 ? (
                      <span className="pill border-gold/50 text-gold">多写 {result.extra.length} 笔</span>
                    ) : null}
                    {result.missing.length === 0 && result.extra.length === 0 && result.orderOk ? (
                      <span className="pill border-jade/50 text-jade">笔画完整、笔序正确</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* 自评 → SM-2 */}
              <div className="divider-bamboo my-4" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-soft">这个字你记住了吗？</span>
                {rated ? (
                  <span className="pill border-jade/50 text-jade">
                    已记录，下次复习：{item?.dueDate}
                  </span>
                ) : (
                  <div className="flex gap-2">
                    {RATINGS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        className={cn(r.className, "px-3 py-1.5 text-xs")}
                        title={r.hint}
                        onClick={() => handleRate(r.value)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : null}
        </div>

        {/* 右：事实与讲解 */}
        <div className="space-y-4">
          <StrokeFactsList
            facts={facts}
            onPlayStroke={(i) => {
              // 播放单笔动画，返回后重新显示描红
              const w = (canvasRef.current as GridCanvasHandle | null)?.playStroke;
              w?.(i);
            }}
          />
          <ExplainCard char={char} facts={facts} />
          <Card>
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="btn-ghost"
                disabled={!prev}
                onClick={() => prev && navigate(`/practice/${encodeURIComponent(prev)}`)}
              >
                <ArrowLeft size={16} /> 上一字
              </button>
              <button
                type="button"
                className="btn-ghost"
                disabled={!next}
                onClick={() => next && navigate(`/practice/${encodeURIComponent(next)}`)}
              >
                下一字 <ArrowRight size={16} />
              </button>
            </div>
            <button
              type="button"
              className="btn-ink mt-3 w-full"
              onClick={() => {
                canvasRef.current?.clear();
                setResult(null);
                setRated(false);
              }}
            >
              <RotateCcw size={16} /> 再练一遍
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
