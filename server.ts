import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import {
  handleBotHealth,
  handleCleanupExpiredAnimations,
  handleScenesCatalog,
  handleSetupWebhook,
  handleStatusPage,
  handleTelegramBotWebhook,
} from './lib/bot/httpHandlers.js';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', async (req, res) => {
    const accept = String(req.headers.accept || '');
    const wantHtml = req.query.format === 'html' || (!req.query.format && accept.includes('text/html') && req.query.format !== 'json');
    try {
      if (wantHtml && req.query.format === 'html') {
        const page = await handleStatusPage();
        res.status(page.status).type('html').send(page.html);
        return;
      }
      const out = await handleBotHealth();
      res.status(out.status).json(out.body);
    } catch (err) {
      console.error('Health check failed:', err);
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'Health check failed' });
    }
  });

  app.get('/api/scenes', async (req, res) => {
    try {
      const out = await handleScenesCatalog(req.query as Record<string, unknown>);
      res.status(out.status).json(out.body);
    } catch (err) {
      console.error('Scenes catalog failed:', err);
      res.status(500).json({ ok: false, error: 'Failed to load scenes' });
    }
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

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`АЛЛО, РОУД! server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
