import { handleBotHealth, handleStatusPage } from '../lib/bot/httpHandlers.js';
import { sendHtml, sendResult, wantsHtml, type VercelRequest, type VercelResponse } from '../lib/server/vercelTypes.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (wantsHtml(req)) {
      const page = await handleStatusPage();
      return sendHtml(res, page.status, page.html);
    }
    const out = await handleBotHealth();
    return sendResult(res, out.status, out.body);
  } catch (err) {
    console.error('Health check failed:', err);
    return sendResult(res, 500, { ok: false, error: err instanceof Error ? err.message : 'Health check failed' });
  }
}
