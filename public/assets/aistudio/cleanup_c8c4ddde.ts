import { handleCleanupExpiredAnimations } from '../../lib/bot/httpHandlers.js';
import { sendResult, type VercelRequest, type VercelResponse } from '../../lib/server/vercelTypes.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendResult(res, 405, { ok: false, error: 'Method Not Allowed' });
  }
  const out = await handleCleanupExpiredAnimations(req.headers);
  return sendResult(res, out.status, out.body);
}
