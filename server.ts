import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import {
  handleBotHealth,
  handleCleanupExpiredAnimations,
  handleSetupWebhook,
  handleTelegramBotWebhook,
} from './lib/bot/httpHandlers';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', async (_req, res) => {
    const out = await handleBotHealth();
    res.status(out.status).json(out.body);
  });

  app.post('/api/telegram/webhook', async (req, res) => {
    const out = await handleTelegramBotWebhook(req.headers, req.body);
    res.status(out.status).json(out.body);
  });

  app.all('/api/telegram/setup', async (req, res) => {
    const queryOrBody = {
      ...(req.query || {}),
      ...(req.body && typeof req.body === 'object' ? req.body : {}),
    };
    const out = await handleSetupWebhook(req.headers, queryOrBody);
    res.status(out.status).json(out.body);
  });

  app.all('/api/telegram/cleanup', async (req, res) => {
    const out = await handleCleanupExpiredAnimations(req.headers);
    res.status(out.status).json(out.body);
  });

  app.get('/', async (_req, res) => {
    const out = await handleBotHealth();
    res.status(out.status).json({
      ...out.body,
      message: 'Telegram Bot «АЛЛО, РОУД! — Pixel Fatality» работает. Используйте бота в Telegram.',
      endpoints: {
        webhook: '/api/telegram/webhook',
        setup: '/api/telegram/setup',
        cleanup: '/api/telegram/cleanup',
        health: '/api/health',
      },
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`АЛЛО, РОУД! Telegram Bot webhook server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Telegram Bot server:', err);
  process.exit(1);
});
