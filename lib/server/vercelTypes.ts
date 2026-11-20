import type { IncomingMessage, ServerResponse } from 'node:http';

export interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  body?: Record<string, unknown>;
}

export interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
}

export function sendResult(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}

export function sendHtml(res: VercelResponse, status: number, html: string): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(html);
}

export function wantsHtml(req: { url?: string; headers: Record<string, string | string[] | undefined> }): boolean {
  if ((req.url || '').includes('format=json')) return false;
  const accept = req.headers['accept'];
  const value = Array.isArray(accept) ? accept.join(',') : accept || '';
  return value.includes('text/html');
}
