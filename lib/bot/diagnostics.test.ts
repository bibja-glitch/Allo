import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStatusHtml, runDiagnostics } from './diagnostics.js';
import { isUpstashConfigured } from './redis.js';

type WebhookInfo = { url: string; pending_update_count?: number; last_error_message?: string; last_error_date?: number };

function stubTelegram(info: WebhookInfo, tokenValid = true) {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: unknown) => {
    const url = String(input);
    const body = url.endsWith('/getMe')
      ? tokenValid
        ? { ok: true, result: { id: 1, username: 'TestBot', first_name: 'Test' } }
        : { ok: false, error_code: 401, description: 'Unauthorized' }
      : url.endsWith('/getWebhookInfo')
        ? { ok: true, result: info }
        : url.endsWith('/getMyDescription')
          ? { ok: true, result: { description: '' } }
          : url.endsWith('/getMyShortDescription')
            ? { ok: true, result: { short_description: '' } }
            : { ok: true, result: true };
    return { json: async () => body } as Response;
  }) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

function setEnv() {
  process.env.TELEGRAM_BOT_TOKEN = '123456789:TEST_TOKEN_VALUE';
  process.env.APP_URL = 'https://example.test';
}

const find = (r: Awaited<ReturnType<typeof runDiagnostics>>, id: string) => r.checks.find((c) => c.id === id)!;

test('diagnostics: webhook not registered is reported as failure', async () => {
  setEnv();
  const restore = stubTelegram({ url: '' });
  try {
    const r = await runDiagnostics();
    assert.equal(find(r, 'tg_token').status, 'ok');
    assert.equal(find(r, 'tg_webhook').status, 'fail');
    assert.equal(r.ok, false);
    const html = renderStatusHtml(r);
    assert.ok(html.includes('❌') && html.includes('Зарегистрировать webhook'));
  } finally {
    restore();
  }
});

test('diagnostics: correct webhook is ok, wrong url and recent 401 are failures', async () => {
  setEnv();
  let restore = stubTelegram({ url: 'https://example.test/api/telegram/webhook', pending_update_count: 0 });
  try {
    assert.equal(find(await runDiagnostics(), 'tg_webhook').status, 'ok');
  } finally {
    restore();
  }

  restore = stubTelegram({ url: 'https://other.test/api/telegram/webhook' });
  try {
    assert.equal(find(await runDiagnostics(), 'tg_webhook').status, 'fail');
  } finally {
    restore();
  }

  restore = stubTelegram({
    url: 'https://example.test/api/telegram/webhook',
    last_error_message: 'Wrong response from the webhook: 401 Unauthorized',
    last_error_date: Math.floor(Date.now() / 1000),
  });
  try {
    const c = find(await runDiagnostics(), 'tg_webhook');
    assert.equal(c.status, 'fail');
    assert.match(c.hint || '', /TELEGRAM_WEBHOOK_SECRET/);
  } finally {
    restore();
  }
});

test('diagnostics: invalid token and database state are reported', async () => {
  setEnv();
  const restore = stubTelegram({ url: '' }, false);
  try {
    const r = await runDiagnostics();
    assert.equal(find(r, 'tg_token').status, 'fail');
    assert.equal(find(r, 'redis').status, isUpstashConfigured() ? 'ok' : 'fail');
  } finally {
    restore();
  }
});

test('status page escapes HTML in details', () => {
  const html = renderStatusHtml({
    ok: false,
    checkedAt: new Date().toISOString(),
    expectedWebhookUrl: null,
    checks: [{ id: 'x', label: 'L', status: 'fail', detail: '<script>alert(1)</script>' }],
  });
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
