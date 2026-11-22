import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("card-paper p-5", className)}>{children}</div>;
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-ink-faint">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("pill", className)}>{children}</span>;
}

export function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-card border border-black/10 bg-white/55 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="mt-1 font-display text-2xl font-600" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

export function scoreTone(score: number): { color: string; label: string } {
  if (score >= 80) return { color: "#4a6b52", label: "Very good" };
  if (score >= 55) return { color: "#c9a227", label: "Almost there" };
  return { color: "#b23a2e", label: "Try again" };
}

export function ScoreRing({
  score,
  size = 120,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = scoreTone(score);
  return (
    <div className="inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(28,26,23,0.10)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, score)) / 100)}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-600" style={{ color: tone.color }}>
          {score}
        </div>
        {label ? <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div> : null}
      </div>
    </div>
  );
}

export function MasteryBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(5, value)) / 5;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
      <div
        className="h-full rounded-full bg-jade transition-[width] duration-500"
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-faint">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-cinnabar" />
      {label}
    </div>
  );
}
