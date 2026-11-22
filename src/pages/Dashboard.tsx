import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Flame, PenLine, Sparkles, TrendingUp } from "lucide-react";
import { Card, MasteryBar, SectionTitle, Stat } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { LANGUAGES, getLang } from "@/i18n/langs";
import { getCharacter, recommendedNewChars } from "@/data/hsk";
import { isDue } from "@/utils/sm2";
import type { NativeLang } from "@/types";

export default function Dashboard() {
  const profile = useStore((s) => s.profile);
  const nativeLang = useStore((s) => s.settings.nativeLang);
  const setNativeLang = useStore((s) => s.setNativeLang);
  const reviewItems = useStore((s) => s.reviewItems);
  const lang = getLang(nativeLang);

  const items = useMemo(() => Object.values(reviewItems), [reviewItems]);
  const due = useMemo(() => items.filter((it) => isDue(it)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [items]);
  const masteredCount = items.filter((it) => it.mastery >= 4).length;
  const learningCount = items.length;

  const newChars = useMemo(
    () => recommendedNewChars(6, new Set(items.map((i) => i.char))),
    [items],
  );

  const recent = useMemo(
    () =>
      [...items]
        .sort((a, b) => (b.lastReviewed ?? "").localeCompare(a.lastReviewed ?? ""))
        .slice(0, 12),
    [items],
  );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* 顶部概览 */}
      <Card className="relative overflow-hidden py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-faint">Today · 今日</p>
            <h1 className="mt-1 font-display text-3xl font-600">
              继续写好每一个字
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              用「田字格描红 → 即时评测 → 母语讲解 → SM-2 复习」把汉字真正记住。
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-faint">母语</span>
            <select
              value={nativeLang}
              onChange={(e) => setNativeLang(e.target.value as NativeLang)}
              className="rounded-lg border border-black/15 bg-white/70 px-3 py-1.5 text-sm outline-none focus:border-cinnabar/50"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="连续练习" value={`${profile?.streakDays ?? 0} 天`} accent="#b23a2e" />
          <Stat label="累计练习" value={profile?.totalPracticed ?? 0} />
          <Stat label="在学汉字" value={learningCount} />
          <Stat label="已掌握" value={masteredCount} accent="#4a6b52" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* 今日复习队列 */}
          <section>
            <SectionTitle
              title="今日复习"
              hint={`${due.length} 个汉字到期待复习`}
              action={
                <Link to="/review" className="btn-ghost">
                  <CalendarClock size={16} /> 复习计划
                </Link>
              }
            />
            {due.length === 0 ? (
              <Card className="text-sm text-ink-faint">
                今天没有到期的复习。去学习新字，或用左侧「练字」自由练习。
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {due.slice(0, 15).map((it) => (
                  <Link
                    key={it.char}
                    to={`/practice/${encodeURIComponent(it.char)}`}
                    className="card-paper group flex flex-col items-center gap-2 p-4 transition-transform hover:-translate-y-0.5"
                  >
                    <span className="font-hanzi text-4xl transition-colors group-hover:text-cinnabar">
                      {it.char}
                    </span>
                    <MasteryBar value={it.mastery} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 推荐新字 */}
          <section>
            <SectionTitle title="推荐新字" hint="按 HSK 顺序推荐，尚未学习的字" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {newChars.map((c) => (
                <Link
                  key={c.char}
                  to={`/practice/${encodeURIComponent(c.char)}`}
                  className="card-paper group flex flex-col items-center gap-1 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <span className="font-hanzi text-4xl transition-colors group-hover:text-cinnabar">
                    {c.char}
                  </span>
                  <span className="font-display text-xs text-ink-faint">{c.pinyin}</span>
                  <span className="line-clamp-1 text-[11px] text-ink-faint">{c.meaning}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* 掌握度面板 */}
        <div className="space-y-6">
          <Card>
            <SectionTitle title="我的进度" hint="最近练习的汉字掌握度" />
            {recent.length === 0 ? (
              <p className="text-sm text-ink-faint">还没有练习记录。先从「推荐新字」开始吧。</p>
            ) : (
              <div className="space-y-2.5">
                {recent.map((it) => {
                  const rec = getCharacter(it.char);
                  return (
                    <Link
                      key={it.char}
                      to={`/practice/${encodeURIComponent(it.char)}`}
                      className="flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-black/[0.03]"
                    >
                      <span className="font-hanzi text-2xl">{it.char}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-soft">{rec?.pinyin ?? ""}</span>
                          <span className="text-ink-faint">掌握 {it.mastery}/5</span>
                        </div>
                        <div className="mt-1">
                          <MasteryBar value={it.mastery} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-cinnabar" />
              <h3 className="section-title text-base">快捷入口</h3>
            </div>
            <Link to="/practice" className="btn-ink w-full">
              <PenLine size={16} /> 进入练字队列
            </Link>
            <Link to="/library" className="btn-ghost w-full">
              <Sparkles size={16} /> 浏览 HSK 1–3 字库
            </Link>
            <p className="text-xs leading-relaxed text-ink-faint">
              当前讲解语言：{lang.nativeName}（{lang.englishName}）。可在上方或「设置」中切换。
            </p>
            <div className="flex items-center gap-2 text-xs text-ink-faint">
              <Flame size={13} className="text-cinnabar" />
              坚持练习可累积连续天数。
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
