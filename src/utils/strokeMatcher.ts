import type { EvaluationResult, StrokeData, StrokeScore } from "@/types";
import { dataPointToCanvas } from "./strokes";

export type Point = [number, number];

const RESAMPLE_N = 32;

export function pathLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

/** 按弧长等距重采样为固定点数 */
export function resample(points: Point[], n = RESAMPLE_N): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array.from({ length: n }, () => [points[0][0], points[0][1]] as Point);
  const total = pathLength(points);
  if (total === 0) return Array.from({ length: n }, () => [points[0][0], points[0][1]] as Point);
  const interval = total / (n - 1);
  const out: Point[] = [[points[0][0], points[0][1]]];
  let dAcc = 0;
  let prev = points[0];
  let i = 1;
  let curr = points[1];
  while (i < points.length) {
    const seg = Math.hypot(curr[0] - prev[0], curr[1] - prev[1]);
    if (dAcc + seg >= interval) {
      const t = (interval - dAcc) / seg;
      const np: Point = [prev[0] + t * (curr[0] - prev[0]), prev[1] + t * (curr[1] - prev[1])];
      out.push(np);
      prev = np;
      dAcc = 0;
    } else {
      dAcc += seg;
      prev = curr;
      curr = points[++i];
    }
  }
  while (out.length < n) out.push([points[points.length - 1][0], points[points.length - 1][1]]);
  return out.slice(0, n);
}

function avgDistance(a: Point[], b: Point[]): number {
  const n = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1]);
  return sum / (n || 1);
}

function strokeVector(points: Point[]): [number, number] {
  const s = points[0];
  const e = points[points.length - 1];
  return [e[0] - s[0], e[1] - s[1]];
}

function angleBetween(a: [number, number], b: [number, number]): number {
  const la = Math.hypot(a[0], a[1]);
  const lb = Math.hypot(b[0], b[1]);
  if (la === 0 || lb === 0) return 0;
  const cos = (a[0] * b[0] + a[1] * b[1]) / (la * lb);
  return Math.acos(Math.max(-1, Math.min(1, cos)));
}

/**
 * 手写轨迹比对（参考 $1 Unistroke / Hanzi-Writer Quiz 思路）：
 * 将用户笔画与标准笔画中线点集在田字格同一坐标系下比对，
 * 综合「位置距离 + 方向一致性」打分，并检测笔序与缺失/多余笔画。
 */
export function evaluateStrokes(
  userStrokes: Point[][],
  charData: StrokeData,
  size: number,
  padding: number,
): EvaluationResult {
  const refMedians: Point[][] = charData.medians.map((m) =>
    m.map((p) => dataPointToCanvas(p as [number, number], size, padding)),
  );
  const refResampled = refMedians.map((m) => resample(m));

  const user = userStrokes
    .map((s) => s.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])))
    .filter((s) => s.length >= 2)
    .map((s) => resample(s));

  const scale = size - padding * 2 || size;
  const n = refResampled.length;
  const scores: StrokeScore[] = [];
  const missing: number[] = [];
  const extra: number[] = [];

  // 逐笔（按顺序）评分
  for (let i = 0; i < n; i++) {
    const ref = refResampled[i];
    if (i >= user.length) {
      missing.push(i + 1);
      scores.push({ index: i + 1, score: 0, directionOk: false, startOk: false, matched: false });
      continue;
    }
    const u = user[i];
    const dPos = avgDistance(u, ref) / scale;
    const dDir = angleBetween(strokeVector(u), strokeVector(ref)) / Math.PI;
    const startDist = Math.hypot(u[0][0] - ref[0][0], u[0][1] - ref[0][1]) / scale;

    const posScore = Math.max(0, Math.min(1, 1 - dPos / 0.18));
    const dirScore = Math.max(0, Math.min(1, 1 - dDir / 0.6));
    let score = Math.round(100 * (0.7 * posScore + 0.3 * dirScore));
    if (startDist > 0.2) score = Math.round(score * 0.6);
    score = Math.max(0, Math.min(100, score));

    scores.push({
      index: i + 1,
      score,
      directionOk: dDir < 0.35,
      startOk: startDist <= 0.2,
      matched: true,
    });
  }
  for (let i = n; i < user.length; i++) extra.push(i + 1);

  // 笔序检测：用户第 i 笔是否更接近标准中的另一笔（且更优）？
  let orderOk = true;
  for (let i = 0; i < Math.min(user.length, n); i++) {
    const inOrder = avgDistance(user[i], refResampled[i]);
    let best = inOrder;
    let bestJ = i;
    for (let j = 0; j < n; j++) {
      const d = avgDistance(user[i], refResampled[j]);
      if (d < best) {
        best = d;
        bestJ = j;
      }
    }
    if (bestJ !== i && best < inOrder * 0.55) {
      orderOk = false;
      break;
    }
  }

  const matchedScores = scores.filter((s) => s.matched).map((s) => s.score);
  const base = matchedScores.length
    ? matchedScores.reduce((a, b) => a + b, 0) / matchedScores.length
    : 0;
  const penalty = missing.length * 8 + extra.length * 5 + (orderOk ? 0 : 10);
  const overall = Math.max(0, Math.min(100, Math.round(base - penalty)));

  return { overall, strokes: scores, missing, extra, orderOk };
}

export function scoreTone(score: number): "jade" | "gold" | "cinnabar" {
  if (score >= 80) return "jade";
  if (score >= 55) return "gold";
  return "cinnabar";
}
