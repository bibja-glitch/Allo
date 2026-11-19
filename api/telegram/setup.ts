import { handleSetupWebhook } from '../../lib/bot/httpHandlers';
import { sendResult, type VercelRequest, type VercelResponse } from '../../lib/server/vercelTypes';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return sendResult(res, 405, { ok: false, error: 'Method Not Allowed' });
  }
  const queryOrBody =
    req.body && typeof req.body === 'object'
      ? (req.body as Record<string, unknown>)
      : {};
  const out = await handleSetupWebhook(req.headers, queryOrBody);
  return sendResult(res, out.status, out.body);
}
