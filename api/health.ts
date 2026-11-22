import { configuredProviders } from "./_lib/providers";

/** GET /api/health —— 返回服务端已配置的模型提供商 */
export default function handler(req: any, res: any) {
  res.status(200).json({ ok: true, providersConfigured: configuredProviders() });
}
