import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarClock,
  Camera,
  Flame,
  LayoutDashboard,
  Library,
  PenLine,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { getLang } from "@/i18n/langs";

const NAV = [
  { to: "/game", label: "每日一字", en: "Daily", icon: Flame, end: false, external: true },
  { to: "/", label: "学习台", en: "Today", icon: LayoutDashboard, end: true },
  { to: "/practice", label: "练字", en: "Practice", icon: PenLine, end: false },
  { to: "/camera", label: "拍照评测", en: "Camera", icon: Camera, end: false },
  { to: "/review", label: "复习", en: "Review", icon: CalendarClock, end: false },
  { to: "/library", label: "字库", en: "Library", icon: Library, end: false },
  { to: "/settings", label: "设置", en: "Settings", icon: SettingsIcon, end: false },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const profile = useStore((s) => s.profile);
  const nativeLang = useStore((s) => s.settings.nativeLang);
  const lang = getLang(nativeLang);

  return (
    <div className="mx-auto flex min-h-full max-w-[1400px] gap-6 px-4 pb-24 pt-5 md:px-6 lg:pb-8">
      {/* 侧边导航（桌面 / 平板） */}
      <aside className="sticky top-5 hidden h-fit w-60 shrink-0 lg:block">
        <div className="card-paper p-4">
          <div className="flex items-center gap-3 px-1 py-2">
            <span className="seal h-9 w-9 text-lg">汉</span>
            <div>
              <div className="font-display text-lg font-600 leading-none">HanziFlow</div>
              <div className="mt-0.5 text-[11px] text-ink-faint">汉字书写教练</div>
            </div>
          </div>
          <div className="divider-bamboo my-3" />
          <nav className="flex flex-col gap-0.5">
            {NAV.map(({ to, label, en, icon: Icon, end, external }) => external ? (
              <a
                key={to}
                href={to}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-black/[0.04]"
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{label}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wide text-ink-faint">{en}</span>
              </a>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-cinnabar/10 font-medium text-cinnabar"
                      : "text-ink-soft hover:bg-black/[0.04]",
                  )
                }
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{label}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wide text-ink-faint">{en}</span>
              </NavLink>
            ))}
          </nav>
          <div className="divider-bamboo my-3" />
          <div className="flex items-center justify-between px-1 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <Flame size={14} className="text-cinnabar" />
              {profile?.streakDays ?? 0} 天
            </span>
            <span className="pill">{lang.nativeName}</span>
          </div>
        </div>
      </aside>

      {/* 主工作区 */}
      <main className="min-w-0 flex-1">
        <header className="mb-4 flex items-center gap-3 lg:hidden">
          <span className="seal h-9 w-9 text-lg">汉</span>
          <div className="font-display text-lg font-600">HanziFlow</div>
          <span className="pill ml-auto">{lang.nativeName}</span>
        </header>
        {children}
      </main>

      {/* 底部标签栏（移动端） */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-black/10 bg-[#faf6ee]/95 backdrop-blur lg:hidden">
        {NAV.map(({ to, label, icon: Icon, end, external }) => external ? (
          <a
            key={to}
            href={to}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-ink-faint"
          >
            <Icon size={19} strokeWidth={1.9} />
            {label}
          </a>
        ) : (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
                isActive ? "text-cinnabar" : "text-ink-faint",
              )
            }
          >
            <Icon size={19} strokeWidth={1.9} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
