import { useMemo } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Layers } from "lucide-react";
import { Card, MasteryBar, SectionTitle } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { getCharacter, recommendedNewChars } from "@/data/hsk";
import { isDue } from "@/utils/sm2";

export default function PracticeQueue() {
  const reviewItems = useStore((s) => s.reviewItems);
  const items = useMemo(() => Object.values(reviewItems), [reviewItems]);

  const due = useMemo(
    () => items.filter((it) => isDue(it)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [items],
  );
  const newChars = useMemo(
    () => recommendedNewChars(12, new Set(items.map((i) => i.char))),
    [items],
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <Card>
        <h1 className="font-display text-2xl font-600">练字队列</h1>
        <p className="mt-1 text-sm text-ink-soft">
          先复习到期汉字，再学习新字。点击任意汉字进入田字格练习。
        </p>
      </Card>

      <section>
        <SectionTitle title="待复习" hint={`${due.length} 个汉字`} />
        {due.length === 0 ? (
          <Card className="text-sm text-ink-faint">暂无到期汉字。</Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {due.map((it) => (
              <Link
                key={it.char}
                to={`/practice/${encodeURIComponent(it.char)}`}
                className="card-paper group flex flex-col items-center gap-2 p-3 transition-transform hover:-translate-y-0.5"
              >
                <span className="font-hanzi text-3xl transition-colors group-hover:text-cinnabar">
                  {it.char}
                </span>
                <MasteryBar value={it.mastery} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="学习新字" hint="按 HSK 1 → 3 顺序推荐" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {newChars.map((c) => (
            <Link
              key={c.char}
              to={`/practice/${encodeURIComponent(c.char)}`}
              className="card-paper group flex flex-col items-center gap-1 p-3 transition-transform hover:-translate-y-0.5"
            >
              <span className="font-hanzi text-3xl transition-colors group-hover:text-cinnabar">
                {c.char}
              </span>
              <span className="font-display text-[11px] text-ink-faint">{c.pinyin}</span>
              <span className="pill mt-0.5 text-[10px]">
                <Layers size={10} /> HSK {c.hskLevel}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {items.length === 0 ? (
        <Card className="flex items-center gap-3 text-sm text-ink-faint">
          <GraduationCap size={18} className="text-cinnabar" />
          还没有任何学习记录。点击上方新字开始第一次练习；练习后会用 SM-2 算法安排复习。
        </Card>
      ) : null}
    </div>
  );
}
