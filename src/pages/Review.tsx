import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, CalendarClock, PenLine } from "lucide-react";
import { Card, MasteryBar, SectionTitle, Stat } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { getCharacter } from "@/data/hsk";
import { addDaysISO, isDue, previewInterval, todayISO } from "@/utils/sm2";
import type { ReviewItem, ReviewRating } from "@/types";

const RATINGS: { value: ReviewRating; label: string; className: string }[] = [
  { value: 2, label: "认识", className: "btn-ink" },
  { value: 1, label: "模糊", className: "btn-ghost" },
  { value: 0, label: "忘记", className: "btn-primary" },
];

function RatingButtons({ item, onRate }: { item: ReviewItem; onRate: (r: ReviewRating) => void }) {
  return (
    <div className="flex gap-1.5">
      {RATINGS.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onRate(r.value)}
          title={`下次间隔 ${previewInterval(item, r.value)} 天`}
          className={`${r.className} px-2.5 py-1 text-xs`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export default function Review() {
  const reviewItems = useStore((s) => s.reviewItems);
  const rateChar = useStore((s) => s.rateChar);
  const [done, setDone] = useState<Record<string, ReviewRating>>({});

  const items = useMemo(() => Object.values(reviewItems), [reviewItems]);
  const due = useMemo(
    () => items.filter((it) => isDue(it)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [items],
  );
  const scheduled = useMemo(
    () => items.filter((it) => !isDue(it)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [items],
  );

  const avgInterval = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round(items.reduce((a, b) => a + b.interval, 0) / items.length);
  }, [items]);

  const forecast = useMemo(() => {
    const today = todayISO();
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDaysISO(today, i);
      const count = items.filter((it) => it.dueDate === day).length;
      return { day, count };
    });
  }, [items]);
  const maxForecast = Math.max(1, ...forecast.map((f) => f.count));

  const handleRate = (char: string, rating: ReviewRating) => {
    rateChar(char, rating);
    setDone((d) => ({ ...d, [char]: rating }));
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <Card>
        <h1 className="font-display text-2xl font-600">复习计划</h1>
        <p className="mt-1 text-sm text-ink-soft">
          基于 SM-2 间隔重复算法安排复习。用「认识 / 模糊 / 忘记」反馈，系统自动计算下次复习时间。
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="待复习" value={due.length} accent="#b23a2e" />
          <Stat label="已排程" value={scheduled.length} />
          <Stat label="平均间隔" value={`${avgInterval} 天`} accent="#4a6b52" />
        </div>
      </Card>

      <section>
        <SectionTitle title="今日待复习" hint={`${due.length} 个汉字`} />
        {due.length === 0 ? (
          <Card className="flex items-center gap-3 text-sm text-ink-faint">
            <Brain size={18} className="text-jade" />
            今天的复习已清空，太棒了！去学习新字或稍后再来。
          </Card>
        ) : (
          <div className="space-y-2">
            {due.map((it) => {
              const rec = getCharacter(it.char);
              const rated = done[it.char];
              return (
                <Card key={it.char} className="flex items-center gap-4 py-3">
                  <Link
                    to={`/practice/${encodeURIComponent(it.char)}`}
                    className="font-hanzi text-3xl transition-colors hover:text-cinnabar"
                    title="去练字"
                  >
                    {it.char}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-display text-ink-soft">{rec?.pinyin ?? ""}</span>
                      <span className="text-xs text-ink-faint">复习 {it.reviews} 次</span>
                    </div>
                    <div className="mt-1 max-w-[220px]">
                      <MasteryBar value={it.mastery} />
                    </div>
                  </div>
                  {rated !== undefined ? (
                    <span className="pill border-jade/50 text-jade">
                      已记录 · {addDaysISO(todayISO(), it.interval)}
                    </span>
                  ) : (
                    <RatingButtons item={it} onRate={(r) => handleRate(it.char, r)} />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="未来 7 天到期预测" />
        <Card>
          <div className="flex items-end justify-between gap-3">
            {forecast.map((f) => (
              <div key={f.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end justify-center">
                  <div
                    className="w-6 rounded-t-md bg-cinnabar/70 transition-[height] duration-500"
                    style={{ height: `${(f.count / maxForecast) * 100}%`, minHeight: f.count ? 6 : 0 }}
                    title={`${f.count} 个`}
                  />
                </div>
                <span className="text-[11px] text-ink-faint">{f.day.slice(5)}</span>
                <span className="text-[11px] font-medium">{f.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle title="已排程" hint="尚未到期的汉字" />
        {scheduled.length === 0 ? (
          <Card className="text-sm text-ink-faint">暂无排程。</Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {scheduled.map((it) => (
              <Link
                key={it.char}
                to={`/practice/${encodeURIComponent(it.char)}`}
                className="card-paper flex flex-col items-center gap-1 p-3 transition-transform hover:-translate-y-0.5"
              >
                <span className="font-hanzi text-2xl">{it.char}</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-ink-faint">
                  <CalendarClock size={10} /> {it.dueDate.slice(5)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Link to="/practice" className="btn-ink">
        <PenLine size={16} /> 去练字
      </Link>
    </div>
  );
}
