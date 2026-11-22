import { useEffect, useState } from "react";
import { Bell, KeyRound, Languages, ShieldCheck, Trash2, Volume2, Wifi, WifiOff } from "lucide-react";
import { Card, Pill, SectionTitle } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { LANGUAGES } from "@/i18n/langs";
import { getHealth } from "@/services/ai";
import { canSpeak } from "@/utils/speech";
import type { HealthResponse, NativeLang, Settings as SettingsType } from "@/types";
import { cn } from "@/lib/utils";

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex gap-1 rounded-full border border-black/10 bg-white/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm transition-colors",
            value === o.value ? "bg-ink text-paper" : "text-ink-soft hover:bg-black/[0.05]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        checked ? "bg-jade" : "bg-black/20",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    setHealth(await getHealth());
    setChecking(false);
  };

  useEffect(() => {
    void checkHealth();
  }, []);

  const providers = health?.providersConfigured ?? [];
  const llmReady = providers.length > 0;

  return (
    <div className="space-y-5 animate-fade-up">
      <Card>
        <h1 className="font-display text-2xl font-600">设置</h1>
        <p className="mt-1 text-sm text-ink-soft">
          配置学习语言、发音、默认评测方式与 AI 服务。所有学习数据仅保存在本机浏览器。
        </p>
      </Card>

      <Card>
        <SectionTitle title="语言与学习" />
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm">
              <Languages size={16} className="text-cinnabar" /> 母语（讲解与反馈语言）
            </span>
            <select
              value={settings.nativeLang}
              onChange={(e) => updateSettings({ nativeLang: e.target.value as NativeLang })}
              className="rounded-lg border border-black/15 bg-white/70 px-3 py-1.5 text-sm outline-none focus:border-cinnabar/50"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} · {l.zhName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm">
              <Volume2 size={16} className="text-cinnabar" /> 汉字朗读（Web Speech）
            </span>
            <div className="flex items-center gap-3">
              {!canSpeak() ? <Pill>不支持</Pill> : null}
              <Toggle
                checked={settings.speechEnabled}
                onChange={(v) => updateSettings({ speechEnabled: v })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm">
              <Bell size={16} className="text-cinnabar" /> 默认评测方式
            </span>
            <Segmented<SettingsType["evalMode"]>
              value={settings.evalMode}
              onChange={(v) => updateSettings({ evalMode: v })}
              options={[
                { value: "trace", label: "描红" },
                { value: "write", label: "自由书写" },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title="AI 服务" hint="用于拍照评测与母语讲解（服务端代理，密钥不暴露给浏览器）" />
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm">
              <KeyRound size={16} className="text-cinnabar" /> 模型提供商
            </span>
            <Segmented<SettingsType["aiProvider"]>
              value={settings.aiProvider}
              onChange={(v) => updateSettings({ aiProvider: v })}
              options={[
                { value: "auto", label: "自动" },
                { value: "openai", label: "OpenAI" },
                { value: "gemini", label: "Gemini" },
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-card border border-black/10 bg-white/50 px-4 py-3 text-sm">
            {llmReady ? (
              <Wifi size={16} className="text-jade" />
            ) : (
              <WifiOff size={16} className="text-ink-faint" />
            )}
            <span className="text-ink-soft">
              {llmReady ? "服务端已配置：" : "服务端尚未配置任何模型密钥。"}
              {llmReady ? providers.join("、") : "当前使用内置离线讲解，手写评测与 SM-2 复习不受影响。"}
            </span>
            <button type="button" className="btn-ghost ml-auto" onClick={checkHealth} disabled={checking}>
              {checking ? "检测中…" : "重新检测"}
            </button>
          </div>

          <div className="rounded-card border border-gold/40 bg-gold/10 px-4 py-3 text-xs leading-relaxed text-ink-soft">
            <div className="mb-1 inline-flex items-center gap-1.5 font-medium text-ink">
              <KeyRound size={13} /> 部署提示
            </div>
            在 Vercel 项目环境变量中设置 <code>OPENAI_API_KEY</code> 与/或{" "}
            <code>GEMINI_API_KEY</code>（可选 <code>OPENAI_MODEL</code> / <code>GEMINI_MODEL</code>）。
            密钥仅在服务端函数中使用，绝不发送到浏览器。
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title="数据与隐私" />
        <div className="space-y-3 text-sm text-ink-soft">
          <p className="inline-flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-jade" />
            学习进度、SM-2 复习状态存于浏览器 IndexedDB，设置存于 localStorage；字表与笔顺为构建期静态数据。
            笔顺数据来源可查证（hanzi-writer-data / Make Me a Hanzi），大模型不参与笔顺生成。
          </p>
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-cinnabar">确认清空全部本地学习数据？此操作不可恢复。</span>
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  await resetAll();
                  setConfirmReset(false);
                }}
              >
                <Trash2 size={16} /> 确认清空
              </button>
              <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
                取消
              </button>
            </div>
          ) : (
            <button type="button" className="btn-ghost" onClick={() => setConfirmReset(true)}>
              <Trash2 size={16} /> 清空本地学习数据
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
