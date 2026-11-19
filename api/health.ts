import { handleBotHealth } from '../lib/bot/httpHandlers';
import { sendResult, type VercelRequest, type VercelResponse } from '../lib/server/vercelTypes';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const out = await handleBotHealth();
  return sendResult(res, out.status, out.body);
}
