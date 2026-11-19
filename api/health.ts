import { handleBotHealth } from '../lib/bot/httpHandlers.js';
import { sendResult, type VercelRequest, type VercelResponse } from '../lib/server/vercelTypes.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const out = await handleBotHealth();
  return sendResult(res, out.status, out.body);
}
