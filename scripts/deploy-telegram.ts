import 'dotenv/config';
import { syncBotVisualProfileOnDeploy } from '../lib/bot/botProfile.js';
import {
  isBotTokenConfigured,
  tgGetMe,
  tgSetMyCommands,
  tgSetMyDescription,
  tgSetMyProfilePhoto,
  tgSetMyShortDescription,
  tgSetWebhook,
} from '../lib/bot/telegramApi.js';

async function main() {
  if (!isBotTokenConfigured()) {
    console.log('Skipping Telegram deploy sync: TELEGRAM_BOT_TOKEN is not set.');
    return;
  }

  const appUrl = (
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  )
    .trim()
    .replace(/\/+$/, '');

  const me = await tgGetMe();
  console.log('Bot:', me.ok ? `@${me.result?.username}` : me.description);

  const profileResult = await syncBotVisualProfileOnDeploy({
    setMyCommands: tgSetMyCommands,
    setMyDescription: tgSetMyDescription,
    setMyShortDescription: tgSetMyShortDescription,
    setMyProfilePhoto: tgSetMyProfilePhoto,
  });

  console.log('Visual profile sync:', JSON.stringify(profileResult, null, 2));

  if (appUrl.startsWith('https://')) {
    const webhookUrl = `${appUrl}/api/telegram/webhook`;
    const hook = await tgSetWebhook({
      url: webhookUrl,
      secretToken: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || undefined,
    });
    console.log('Webhook:', webhookUrl, hook);
  } else {
    console.log('Webhook skipped: APP_URL is not an https:// URL.');
  }
}

main().catch((err) => {
  console.warn('Deploy sync warning:', err instanceof Error ? err.message : err);
});
