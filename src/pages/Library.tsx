import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { CHARACTERS, LEVEL_LABELS, searchCharacters } from "@/data/hsk";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

type LevelFilter = 0 | 1 | 2 | 3;

export default function Library() {
  const reviewItems = useStore((s) => s.reviewItems);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LevelFilter>(0);

  const results = useMemo(() => searchCharacters(query, level), [query, level]);

  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
    for (const ch of CHARACTERS) c[ch.hskLevel] += 1;
    return c;
  }, []);

  return (
    <div className="space-y-5 animate-fade-up">
      <Card>
        <h1 className="font-display text-2xl font-600">HSK 1–3 字库</h1>
        <p className="mt-1 text-sm text-ink-soft">
          共 {CHARACTERS.length} 个汉字（HSK1 {counts[1]} · HSK2 {counts[2]} · HSK3 {counts[3]}）。
          点击汉字进入田字格练习。
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索汉字 / 拼音 / 释义"
              className="w-64 rounded-full border border-black/15 bg-white/70 py-2 pl-9 pr-4 text-sm outline-none focus:border-cinnabar/50"
            />
          </div>
          <div className="flex gap-1 rounded-full border border-black/10 bg-white/50 p-1">
            {([0, 1, 2, 3] as LevelFilter[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  level === l ? "bg-ink text-paper" : "text-ink-soft hover:bg-black/[0.05]",
                )}
              >
                {l === 0 ? "全部" : LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
          <span className="text-xs text-ink-faint">{results.length} 个结果</span>
        </div>
      </Card>

      <SectionTitle title="字表" hint="掌握度角标：已练习的字显示绿点与等级" />
      {results.length === 0 ? (
        <Card className="text-sm text-ink-faint">没有匹配的汉字。</Card>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11">
          {results.map((c) => {
            const item = reviewItems[c.char];
            return (
              <Link
                key={c.char}
                to={`/practice/${encodeURIComponent(c.char)}`}
                className="card-paper group relative flex flex-col items-center gap-1 px-2 py-3 transition-transform hover:-translate-y-0.5"
                title={`${c.pinyin} · ${c.meaning}`}
              >
                {item && item.mastery > 0 ? (
                  <span
                    className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        item.mastery >= 4 ? "#4a6b52" : item.mastery >= 2 ? "#c9a227" : "#b23a2e",
                    }}
                  />
                ) : null}
                <span className="font-hanzi text-3xl transition-colors group-hover:text-cinnabar">
                  {c.char}
                </span>
                <span className="truncate font-display text-[11px] text-ink-faint">{c.pinyin}</span>
                <span className="text-[10px] text-ink-faint">HSK {c.hskLevel}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
