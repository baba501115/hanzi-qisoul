# 上线前检查清单

## 1. 域名与 DNS

- [ ] 在 DNSPod（`qisoul.com` 当前 NS 为 `bonnie.dnspod.net` / `rubine.dnspod.net`）配置 `hanzi.qisoul.com`
- [ ] 推荐：Vercel 绑定 `hanzi.qisoul.com` 后按提示添加 `CNAME`
- [ ] 如果仍用现有服务器：给 `hanzi.qisoul.com` 加 `A` 记录指向 `8.219.101.162`，并在服务器配置该域名的 80/443

当前实测：

- `qisoul.com`：解析到 `8.219.101.162`
- `hanzi.qisoul.com`：未解析（NXDOMAIN）
- `qisoul.com:80`：连接被拒绝
- `qisoul.com:443`：被 Akamai 边缘回退到 Microsoft 证书，`Host: qisoul.com` 返回 400
- 因此不能直接把游戏挂到现有 `qisoul.com` 的 80/443 上，需要先修复域名接入

## 2. Vercel 项目

- [ ] 导入目录：`hanzi-writing-coach/`
- [ ] Framework Preset：`Vite`
- [ ] Build Command：`pnpm build`
- [ ] Output Directory：`dist`
- [ ] 环境变量（可选）：`OPENAI_API_KEY`、`GEMINI_API_KEY`

部署后逐项验证：

- [ ] `https://域名/` 返回 HanziFlow 学习台
- [ ] `https://域名/game/` 返回一日一字游戏
- [ ] `https://域名/game` 自动跳到 `/game/index.html`
- [ ] `https://域名/practice/式` 直达练字页
- [ ] `https://域名/data/strokes.json` 返回 200
- [ ] `https://域名/data/hanzi-writer/式.json` 返回 200
- [ ] `/api/health` 返回 `{ "ok": true, ... }`

## 3. 上线前检查项

- [ ] 确认 `/game/index.html` 的 OG 图片在目标域名下可访问
- [ ] 替换游戏里“Reserved API / Course entry”等占位提示
- [ ] 决定是否接入真实账号云同步（当前游戏与练字进度只在本机 localStorage）
- [ ] 如启用 AI，确认服务端密钥已配置，浏览器端无密钥泄漏
- [ ] 增加 favicon、隐私政策页真实内容、基础埋点

## 4. 本地验证命令

```bash
cd hanzi-writing-coach
pnpm check
pnpm build
```
