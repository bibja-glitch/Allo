import { handleLeavePair } from '../../lib/bot/httpHandlers.js';
import { sendResult, type VercelRequest, type VercelResponse } from '../../lib/server/vercelTypes.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method && req.method !== 'POST') {
    return sendResult(res, 405, { ok: false, error: 'Method Not Allowed' });
  }
  try {
    const out = await handleLeavePair(req.body || {});
    return sendResult(res, out.status, out.body);
  } catch (err) {
    console.error('Leave pair failed:', err);
    return sendResult(res, 500, { ok: false, error: 'Не удалось выйти из пары.' });
  }
}
