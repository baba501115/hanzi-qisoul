import { Ruler } from "lucide-react";
import type { CharFacts } from "@/types";
import { Card } from "@/components/ui";

const DIR_HINT: Record<string, string> = {
  horizontal: "→",
  vertical: "↓",
  "left-falling": "↙",
  "right-falling": "↘",
  dot: "·",
  turn: "↳",
};

/** 笔顺事实面板：展示逐笔名称与方向，数据来自可查证字库，非大模型生成 */
export default function StrokeFactsList({
  facts,
  activeStroke,
  onPlayStroke,
}: {
  facts: CharFacts | null;
  activeStroke?: number;
  onPlayStroke?: (index: number) => void;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Ruler size={16} className="text-cinnabar" />
        <h3 className="section-title text-base">
          笔顺事实
          {facts ? <span className="ml-2 text-xs font-normal text-ink-faint">{facts.strokeCount} 画</span> : null}
        </h3>
      </div>
      {!facts ? (
        <p className="text-sm text-ink-faint">加载中…</p>
      ) : (
        <ul className="grid grid-cols-2 gap-1.5">
          {facts.strokes.map((s) => (
            <li key={s.index}>
              <button
                type="button"
                onClick={() => onPlayStroke?.(s.index - 1)}
                className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors ${
                  activeStroke === s.index
                    ? "border-cinnabar/50 bg-cinnabar/10 text-cinnabar"
                    : "border-black/10 bg-white/50 text-ink-soft hover:border-black/25"
                }`}
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-black/[0.06] text-[11px]">
                  {s.index}
                </span>
                <span className="font-hanzi">{s.typeLabel}</span>
                <span className="ml-auto text-base text-ink-faint">{DIR_HINT[s.direction]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
        数据来源：hanzi-writer-data（Make Me a Hanzi，Arphic Public License）。笔顺由字库数据几何推导，大模型不参与生成。
      </p>
    </Card>
  );
}
