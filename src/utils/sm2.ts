import type { ReviewItem, ReviewRating, SM2State } from "@/types";

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

export function createSM2State(): SM2State {
  return { easeFactor: DEFAULT_EASE, interval: 0, repetitions: 0, dueDate: todayISO() };
}

export function createReviewItem(char: string): ReviewItem {
  return { char, ...createSM2State(), mastery: 0, reviews: 0 };
}

/**
 * SM-2 间隔重复算法。
 * 评分 q ∈ {0 忘记, 1 模糊, 2 认识}：
 *   q < 2 → repetitions 归零，间隔回到 1 天；
 *   q ≥ 2 → 间隔依次为 1、6、round(上次间隔 × EF)，EF 按标准公式更新（下限 1.3）。
 */
export function applySM2(state: SM2State, rating: ReviewRating): SM2State {
  const q = rating;
  let { easeFactor, interval, repetitions } = state;

  if (q < 2) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
  }

  easeFactor = Math.max(MIN_EASE, easeFactor + (0.1 - (2 - q) * (0.08 + (2 - q) * 0.02)));
  easeFactor = Number(easeFactor.toFixed(3));
  interval = Math.max(1, Math.min(interval, 365));

  return { easeFactor, interval, repetitions, dueDate: addDaysISO(todayISO(), interval) };
}

/** 预览某评分下的下次间隔（天），用于 UI 展示 */
export function previewInterval(state: SM2State, rating: ReviewRating): number {
  return applySM2(state, rating).interval;
}

export function masteryFromRepetitions(reps: number): number {
  return Math.max(0, Math.min(5, Math.round(reps)));
}

export function isDue(item: ReviewItem, today = todayISO()): boolean {
  return item.dueDate <= today;
}
