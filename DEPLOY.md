# 统一部署说明

本目录现在是「一日一字游戏 + HanziFlow 书写教练」的统一前端项目。

## 路由

- `/`：HanziFlow 学习台
- `/practice`：练字队列
- `/practice/:char`：单字练字页
- `/review`：SM-2 复习计划
- `/library`：HSK 1–3 字库
- `/camera`：拍照评测
- `/settings`：设置
- `/game/`：一日一字游戏（静态页）
- `/api/*`：Vercel Serverless Functions

## 本地开发

```bash
pnpm install
pnpm dev
pnpm check
pnpm build
pnpm preview
```

## Vercel 部署

1. 将本目录（`hanzi-writing-coach/`）导入 Vercel。
2. Framework Preset：`Vite`
3. Build Command：`pnpm build`
4. Output Directory：`dist`
5. 绑定域名：`hanzi.qisoul.com`
6. 在 Project Settings → Environment Variables 配置可选 AI 密钥：
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`

`/api` 会被 Vercel 自动识别为 Serverless Functions。

## 两模块数据桥

游戏与练字页使用同一个浏览器 `localStorage` key：

- key：`hanziflow.gameBridge`
- 练字页在完成手写评测后写入 `{ char, completedAt }`
- 游戏页加载时读取；如果 `char` 等于今日汉字且 `completedAt` 是今天，就自动把今日打卡标记为完成

这只是本地学习进度的轻量桥接，不替代正式账号云同步。

## 相关数据

- 游戏字库：`public/game/data/characters.merged.json`
- 书写教练字库：`src/data/characters.json`
- 汇总笔顺：`public/data/strokes.json`
- 补充单字笔顺：`public/data/hanzi-writer/*.json`
- 数据生成脚本：`scripts/build-data.mjs`
- 两库合并脚本：`../scripts/merge-hanzi-data.mjs`
