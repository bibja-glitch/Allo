import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import {
  handleBotHealth,
  handleStatusPage,
  handleCleanupExpiredAnimations,
  handleSetupWebhook,
  handleTelegramBotWebhook,
} from './lib/bot/httpHandlers.js';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '2mb' }));

  const statusHandler = async (req: express.Request, res: express.Response) => {
    const accept = String(req.headers.accept || '');
    const asJson = req.query.format === 'json' || !accept.includes('text/html');
    try {
      if (asJson) {
        const out = await handleBotHealth();
        res.status(out.status).json(out.body);
      } else {
        const page = await handleStatusPage();
        res.status(page.status).type('html').send(page.html);
      }
    } catch (err) {
      console.error('Health check failed:', err);
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'Health check failed' });
    }
  };

  app.get('/api/health', statusHandler);

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

  app.get('/', statusHandler);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`АЛЛО, РОУД! Telegram Bot webhook server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Telegram Bot server:', err);
  process.exit(1);
});
