import { handleGetPairState } from '../../lib/bot/httpHandlers.js';
import { sendResult, type VercelRequest, type VercelResponse } from '../../lib/server/vercelTypes.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const out = await handleGetPairState((req.query || {}) as Record<string, unknown>);
    return sendResult(res, out.status, out.body);
  } catch (err) {
    console.error('Pair state fetch failed:', err);
    return sendResult(res, 500, { ok: false, error: 'Не удалось загрузить настройки пары.' });
  }
}
