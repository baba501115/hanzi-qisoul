# HanziFlow · 汉字书写教练

面向零基础外国学习者的中文练字网页应用：田字格描红/书写、手写轨迹比对评测、拍照评测、母语（英/泰/越/西/法/日）字义与笔顺讲解、SM-2 间隔重复复习，内置 HSK 1–3 字表。

纯前端静态站点 + Vercel Serverless Functions，部署到自有域名，无需 App 打包。

## 技术栈

- Vite + React 18 + TypeScript
- [hanzi-writer](https://github.com/chanind/hanzi-writer) 笔顺动画与逐笔演示
- 笔顺数据来自 [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data)（Make Me a Hanzi，Arphic Public License），**可查证、非大模型生成**
- 手写轨迹比对：自研 $1 Unistroke / Hanzi-Writer Quiz 思路（弧长重采样 + 位置距离 + 起笔方向 + 笔序）
- 状态：zustand；本地持久化：IndexedDB（idb）+ localStorage
- 复习算法：SM-2（easeFactor 初始 2.5，最低 1.3）
- 大模型：OpenAI / Gemini，经 `/api/*` 服务端代理，密钥不下发浏览器

## 本地开发

```bash
pnpm install
pnpm dev        # 开发服务器
pnpm check      # 类型检查 (tsc -b --noEmit)
pnpm build      # 生产构建
pnpm preview    # 预览构建产物
```

> 若本机 `pnpm` 配置了失效代理，可加参数绕过：`pnpm --config.proxy= --config.httpsProxy= install`。

## 环境变量（服务端，仅 Vercel Functions 使用）

在项目根目录创建 `.env`（或 Vercel 项目设置中配置），按需配置其一：

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini        # 可选，默认 gpt-4o-mini

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash   # 可选，默认 gemini-1.5-flash
```

未配置任何密钥时应用仍可完整运行：手写评测与 SM-2 全部离线可用，AI 讲解自动降级为离线模板，拍照评测提示需配置密钥。

## 部署（自有域名）

1. 将仓库推送到 Git 托管平台并在 [Vercel](https://vercel.com) 导入。
2. 在 Vercel 项目 Settings → Environment Variables 配置上述密钥。
3. 在 Settings → Domains 绑定自有域名。
4. 构建命令 `pnpm build`，输出目录 `dist/`；`/api` 目录自动识别为 Serverless Functions。

由于是单页应用（BrowserRouter），Vercel 会按 `vercel.json`/默认 SPA 行为回退到 `index.html`；如需 SSH 自定义服务器，请配置所有路由回退到 `index.html`。

## 数据来源与合规

- `src/data/characters.json`、`src/data/words.json`、`public/data/strokes.json` 均由 `scripts/build-data.mjs` 从 `hsk-words`（HSK 1–3 词表）与 `hanzi-writer-data`（笔顺）生成，可复现、可查证。
- 重新生成：`node --experimental-sqlite scripts/build-data.mjs`。
- 大模型仅用于「母语讲解」与「拍照评测」，并被提示词强制约束不得修改或编造笔顺，笔顺事实始终以本地可查证数据为准。
