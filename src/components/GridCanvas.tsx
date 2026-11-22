import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import HanziWriter from "hanzi-writer";
import type { EvaluationResult, StrokeData } from "@/types";
import { evaluateStrokes, type Point } from "@/utils/strokeMatcher";
import { dataPointToCanvas, getStrokeData } from "@/utils/strokes";

/** 与 hanzi-writer 保持一致的画布内边距，确保手写轨迹与标准中线同坐标系 */
const PADDING = 14;

export interface GridCanvasHandle {
  play: () => void;
  playStroke: (index: number) => void;
  showHint: () => void;
  clear: () => void;
  undo: () => void;
  evaluate: () => EvaluationResult | null;
  strokeCount: () => number;
}

interface GridCanvasProps {
  char: string;
  size: number;
  /** 描红底（显示 hanzi-writer 轮廓） */
  outline: boolean;
  /** 载入后自动播放笔顺动画 */
  autoPlay?: boolean;
  onResult?: (result: EvaluationResult) => void;
  onChange?: (strokeCount: number) => void;
}

const INK = "#1c1a17";

function pathOf(points: Point[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M ${first[0].toFixed(1)} ${first[1].toFixed(1)}${rest
    .map((p) => ` L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join("")}`;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#4a6b52";
  if (score >= 55) return "#c9a227";
  return "#b23a2e";
}

interface DrawState {
  strokes: Point[][];
  current: Point[];
}

const GridCanvas = forwardRef<GridCanvasHandle, GridCanvasProps>(function GridCanvas(
  { char, size, outline, autoPlay = false, onResult, onChange },
  ref,
) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const dataRef = useRef<StrokeData | null>(null);
  const drawingRef = useRef(false);

  const [draw, setDraw] = useState<DrawState>({ strokes: [], current: [] });
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  /* ---- 初始化/切换汉字时创建 Hanzi-Writer ---- */
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    let cancelled = false;
    el.innerHTML = "";
    setDraw({ strokes: [], current: [] });
    setResult(null);

    getStrokeData(char)
      .then((data) => {
        if (cancelled || !data || !el) return;
        dataRef.current = data;
        writerRef.current = HanziWriter.create(el, char, {
          width: size,
          height: size,
          padding: PADDING,
          showOutline: outline,
          showCharacter: false,
          strokeColor: INK,
          radicalColor: INK,
          outlineColor: "rgba(178,58,46,0.30)",
          highlightColor: "#b23a2e",
          strokeAnimationSpeed: 0.9,
          delayBetweenStrokes: 240,
          strokeWidth: 3,
          outlineWidth: 3,
          charDataLoader: (_c, onComplete) => {
            onComplete(data);
          },
          onLoadCharDataSuccess: () => {
            const w = writerRef.current;
            if (!w) return;
            if (outline) void w.showOutline();
            if (autoPlay) void w.animateCharacter();
          },
        });
      })
      .catch(() => {
        /* 数据缺失时留白，评测将提示无数据 */
      });

    return () => {
      cancelled = true;
      writerRef.current = null;
    };
    // 仅在汉字或画布尺寸变化时重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char, size]);

  /* 描红开关单独同步，避免重建实例 */
  useEffect(() => {
    const w = writerRef.current;
    if (!w) return;
    if (outline) void w.showOutline();
    else void w.hideOutline();
  }, [outline]);

  useEffect(() => {
    onChange?.(draw.strokes.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw.strokes.length]);

  const toLocal = useCallback(
    (clientX: number, clientY: number): Point => {
      const svg = svgRef.current;
      if (!svg) return [0, 0];
      const rect = svg.getBoundingClientRect();
      return [((clientX - rect.left) / rect.width) * size, ((clientY - rect.top) / rect.height) * size];
    },
    [size],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      setResult(null);
      const p = toLocal(e.clientX, e.clientY);
      setDraw((d) => ({ ...d, current: [p] }));
    },
    [toLocal],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!drawingRef.current) return;
      const p = toLocal(e.clientX, e.clientY);
      setDraw((d) => {
        const last = d.current[d.current.length - 1];
        if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.2) return d;
        return { ...d, current: [...d.current, p] };
      });
    },
    [toLocal],
  );

  const endStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    setDraw((d) =>
      d.current.length >= 2
        ? { strokes: [...d.strokes, d.current], current: [] }
        : { ...d, current: [] },
    );
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        writerRef.current?.animateCharacter();
      },
      playStroke: (index: number) => {
        writerRef.current?.animateStroke(index);
      },
      showHint: () => {
        const w = writerRef.current;
        if (!w) return;
        void w.showOutline();
        void w.animateCharacter();
      },
      clear: () => {
        setDraw({ strokes: [], current: [] });
        setResult(null);
      },
      undo: () => {
        setDraw((d) => ({ ...d, strokes: d.strokes.slice(0, -1) }));
        setResult(null);
      },
      evaluate: () => {
        const data = dataRef.current;
        if (!data) return null;
        const r = evaluateStrokes(drawRef.current.strokes, data, size, PADDING);
        setResult(r);
        onResult?.(r);
        return r;
      },
      strokeCount: () => drawRef.current.strokes.length,
    }),
    [size, onResult],
  );

  const colorFor = (i: number): string => {
    if (!result) return INK;
    const s = result.strokes.find((x) => x.index === i + 1);
    if (!s) return "#8a8578";
    return scoreColor(s.score);
  };

  const missingPaths =
    result && dataRef.current
      ? result.missing
          .map((idx) => {
            const med = dataRef.current?.medians[idx - 1];
            if (!med) return null;
            const pts = med.map((p) => dataPointToCanvas(p as [number, number], size, PADDING));
            return { idx, d: pathOf(pts) };
          })
          .filter(Boolean) as { idx: number; d: string }[]
      : [];

  const c = size / 2;

  return (
    <div
      className="relative select-none touch-none rounded-[18px] border border-black/15 bg-[#fbf8f1] shadow-paper"
      style={{ width: size, height: size }}
    >
      {/* 田字格辅助线 */}
      <svg
        className="pointer-events-none absolute inset-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <g stroke="rgba(178,58,46,0.20)" strokeWidth={1} strokeDasharray="7 7">
          <line x1={c} y1={0} x2={c} y2={size} />
          <line x1={0} y1={c} x2={size} y2={c} />
          <line x1={0} y1={0} x2={size} y2={size} />
          <line x1={size} y1={0} x2={0} y2={size} />
        </g>
        <rect
          x={0.5}
          y={0.5}
          width={size - 1}
          height={size - 1}
          fill="none"
          stroke="rgba(28,26,23,0.4)"
          strokeWidth={1.5}
        />
      </svg>

      {/* 笔顺动画层（hanzi-writer 挂载点） */}
      <div ref={targetRef} className="pointer-events-none absolute inset-0" />

      {/* 手写轨迹与评测层 */}
      <svg
        ref={svgRef}
        className="absolute inset-0 cursor-crosshair touch-none"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={endStroke}
      >
        {/* 缺失笔画的提示（标准中线，朱砂虚线） */}
        {missingPaths.map(({ idx, d }) => (
          <path
            key={`missing-${idx}`}
            d={d}
            fill="none"
            stroke="#b23a2e"
            strokeWidth={3.5}
            strokeDasharray="7 7"
            strokeLinecap="round"
            opacity={0.75}
          />
        ))}
        {/* 用户已写笔画 */}
        {draw.strokes.map((s, i) => (
          <path
            key={`s-${i}`}
            d={pathOf(s)}
            fill="none"
            stroke={colorFor(i)}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* 正在书写的一笔 */}
        {draw.current.length > 0 && (
          <path
            d={pathOf(draw.current)}
            fill="none"
            stroke={INK}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
});

export default GridCanvas;
