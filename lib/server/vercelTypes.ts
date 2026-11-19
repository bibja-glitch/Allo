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
