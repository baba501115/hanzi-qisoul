import type { CharFacts, StrokeData, StrokeDirection, StrokeFact } from "@/types";

let cachePromise: Promise<Record<string, StrokeData>> | null = null;

/** 加载全部笔顺数据（一次性，浏览器缓存） */
export function loadAllStrokeData(): Promise<Record<string, StrokeData>> {
  if (!cachePromise) {
    const url = `${import.meta.env.BASE_URL}data/strokes.json`;
    cachePromise = fetch(url).then((r) => {
      if (!r.ok) throw new Error("笔顺数据加载失败");
      return r.json();
    });
  }
  return cachePromise;
}

export async function getStrokeData(char: string): Promise<StrokeData | null> {
  const raw = await loadSingleStrokeData(char);
  if (raw) return raw;

  const all = await loadAllStrokeData();
  return all[char] ?? null;
}

/** 按汉字读取原始 Hanzi-Writer 文件；未找到时返回 null 以回退到汇总数据。 */
async function loadSingleStrokeData(char: string): Promise<StrokeData | null> {
  try {
    const url = `${import.meta.env.BASE_URL}data/hanzi-writer/${encodeURIComponent(char)}.json`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as StrokeData;
  } catch {
    return null;
  }
}

/**
 * 数据坐标 → 画布坐标。
 *
 * hanzi-writer 使用的字符边界为 x:[0,1024]、y:[-124,900]（Make Me a Hanzi 约定，y 轴向上），
 * 其内部 SVG 变换为 `translate(xOffset, height - yOffset) scale(scale, -scale)`。
 * 这里复刻同一映射，确保标准笔画中线与用户手写轨迹处于完全相同的坐标系，
 * 从而「手写轨迹比对」才具备可比性。
 */
const GLYPH_BOUNDS = { x0: 0, y0: -124, x1: 1024, y1: 900 };
const GLYPH_W = GLYPH_BOUNDS.x1 - GLYPH_BOUNDS.x0; // 1024
const GLYPH_H = GLYPH_BOUNDS.y1 - GLYPH_BOUNDS.y0; // 1024

export function dataPointToCanvas(
  p: [number, number],
  size: number,
  padding: number,
): [number, number] {
  const s = (size - padding * 2) / GLYPH_W;
  return [
    padding + (p[0] - GLYPH_BOUNDS.x0) * s,
    size - padding - (p[1] - GLYPH_BOUNDS.y0) * s,
  ];
}

const DIR_LABELS: Record<StrokeDirection, string> = {
  horizontal: "横",
  vertical: "竖",
  "left-falling": "撇",
  "right-falling": "捺",
  dot: "点",
  turn: "折（含钩）",
};

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * 由标准笔画的中线点集几何推导笔画方向，属于「基于可查证数据的计算」，不涉及大模型。
 */
export function classifyStroke(median: [number, number][]): StrokeDirection {
  if (median.length < 2) return "dot";
  const start = median[0];
  const end = median[median.length - 1];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const len = Math.hypot(dx, dy);

  if (len < 90) return "dot";

  const mid = median[Math.floor(median.length / 2)];
  const a1 = Math.atan2(mid[1] - start[1], mid[0] - start[0]);
  const a2 = Math.atan2(end[1] - mid[1], end[0] - mid[0]);
  const bend = Math.abs(normalizeAngle(a2 - a1));
  if (bend > Math.PI * 0.35) return "turn";

  if (Math.abs(dx) >= 2 * Math.abs(dy)) return "horizontal";
  if (Math.abs(dy) >= 2 * Math.abs(dx)) return "vertical";
  if (dx < 0 && dy < 0) return "left-falling";
  if (dx > 0 && dy < 0) return "right-falling";
  return "turn";
}

/** 生成「笔顺事实」，供母语讲解接地引用 */
export function buildStrokeFacts(char: string, data: StrokeData): CharFacts {
  const strokes: StrokeFact[] = data.medians.map((median, i) => {
    const direction = classifyStroke(median);
    const start = median[0] ?? [0, 0];
    const end = median[median.length - 1] ?? start;
    return {
      index: i + 1,
      typeLabel: DIR_LABELS[direction],
      direction,
      // 归一化到 [0,1]，y 轴向下（直观的上下），与 hanzi-writer 字形边界一致
      startPoint: [
        Number(((start[0] - GLYPH_BOUNDS.x0) / GLYPH_W).toFixed(3)),
        Number(((GLYPH_BOUNDS.y1 - start[1]) / GLYPH_H).toFixed(3)),
      ],
      endPoint: [
        Number(((end[0] - GLYPH_BOUNDS.x0) / GLYPH_W).toFixed(3)),
        Number(((GLYPH_BOUNDS.y1 - end[1]) / GLYPH_H).toFixed(3)),
      ],
    };
  });
  return {
    char,
    strokeCount: data.medians.length,
    strokes,
    dataSource: "hanzi-writer-data",
  };
}

export function directionLabel(dir: StrokeDirection): string {
  return DIR_LABELS[dir];
}
