# Cloudflare Pages 部署说明（绕过 Vercel 登录限制）

当前 Vercel 账号被风控，普通登录一直跳到账户恢复页面。建议先改用 Cloudflare Pages 上线。

## 为什么可以用 Cloudflare Pages

- 本项目核心是静态页面 + 浏览器本地功能：
  - 一日一字游戏：`/game/`
  - 练字、笔顺动画、手写轨迹评测：`/practice/*`
  - SM-2 复习、字库、设置：本地运行
- 当前只有两个 AI 功能依赖服务端：
  - 拍照评测 `/api/evaluate-photo`
  - 母语讲解 `/api/explain`
- 没有 AI 时，母语讲解会降级为离线模板，拍照评测会提示需要配置密钥，不影响核心体验。

所以可以先上线游戏和练字，AI 之后再接。

## 上传方式

### 方式一：网页拖拽（最简单）

1. 打开 `https://dash.cloudflare.com/`
2. 登录或注册 Cloudflare 账号
3. 左侧进入 `Workers & Pages`（Workers 和 Pages）
4. 点 `Create` → `Pages` → `Direct Upload`
5. 项目名填：`hanzi-qisoul`
6. 把本目录下的 `dist/` 文件夹拖进去
7. 点 `Deploy site`

部署完成后 Cloudflare 会给你一个类似：

```text
https://hanzi-qisoul.pages.dev
```

先用这个临时网址访问测试。

### 方式二：连接 Git

1. 先把这个项目推到 GitHub 仓库
2. Cloudflare Pages → `Create` → `Pages` → `Connect to Git`
3. 选择仓库
4. Build command：`pnpm build`
5. Build output directory：`dist`
6. 保存并部署

## SPA 路由

已经准备好 `dist/_redirects`：

```text
/game  /game/index.html 200
/game/ /game/index.html 200
/*  /index.html 200
```

因此 `/practice/式` 这种地址刷新后也不会 404。

## 部署后验证

- `https://你的.pages.dev/`：学习台
- `https://你的.pages.dev/game/`：一日一字游戏
- `https://你的.pages.dev/practice/式`：单字练字页
- `https://你的.pages.dev/data/strokes.json`：返回 200
- `https://你的.pages.dev/data/hanzi-writer/式.json`：返回 200

## 绑定域名

临时地址测试没问题后：

1. Cloudflare Pages 项目 → `Custom domains`
2. 添加 `hanzi.qisoul.com`
3. 如果 `qisoul.com` 的 DNS 在 Cloudflare，可直接自动添加记录
4. 如果 DNS 在 DNSPod，按 Cloudflare 给的值在 DNSPod 加 CNAME

当前 `hanzi.qisoul.com` 尚未解析，需要补上。

## AI 功能后续接法

- 把 Vercel 的 `/api` 改写为 Cloudflare Workers/Functions
- 或者等 Vercel 账号恢复后，再单独部署一个 Vercel 项目处理 `/api`
- 前端 `src/services/ai.ts` 已按相对 `/api` 请求，后面只要目标平台支持 Functions 即可接上

## 关键文件

- `dist/`：可直接上传
- `dist/_redirects`：Cloudflare Pages SPA 路由
- `dist/game/`：一日一字游戏
- `dist/data/`：笔顺数据
