import { BOT_COMMANDS } from './botProfile.js';
import type { InlineKeyboardMarkup } from './messages.js';

export interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  errorCode?: number;
  retryAfter?: number;
}

export interface TelegramSentMessage {
  message_id: number;
  chat: { id: number; type: string };
}

function getBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token && token.length > 10 ? token : null;
}

export function isBotTokenConfigured(): boolean {
  return Boolean(getBotToken());
}

async function postJson<T>(
  method: string,
  payload: Record<string, unknown>
): Promise<TelegramApiResponse<T>> {
  const token = getBotToken();
  if (!token) {
    return { ok: false, description: 'TELEGRAM_BOT_TOKEN is not configured' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      result?: T;
      description?: string;
      error_code?: number;
      parameters?: { retry_after?: number };
    };
    return {
      ok: Boolean(data.ok),
      result: data.result,
      description: data.description,
      errorCode: data.error_code,
      retryAfter: data.parameters?.retry_after,
    };
  } catch (err) {
    return {
      ok: false,
      description: err instanceof Error ? err.message : 'Telegram network error',
    };
  }
}

export async function tgSendMessage(params: {
  chatId: string | number;
  text: string;
  parseMode?: 'HTML';
  replyMarkup?: InlineKeyboardMarkup;
}): Promise<TelegramApiResponse<TelegramSentMessage>> {
  return postJson<TelegramSentMessage>('sendMessage', {
    chat_id: params.chatId,
    text: params.text,
    ...(params.parseMode ? { parse_mode: params.parseMode } : {}),
    ...(params.replyMarkup ? { reply_markup: params.replyMarkup } : {}),
  });
}

export async function tgEditMessageText(params: {
  chatId: string | number;
  messageId: string | number;
  text: string;
  parseMode?: 'HTML';
  replyMarkup?: InlineKeyboardMarkup;
}): Promise<TelegramApiResponse<TelegramSentMessage>> {
  const payload = {
    chat_id: params.chatId,
    message_id: Number(params.messageId),
    text: params.text,
    ...(params.parseMode ? { parse_mode: params.parseMode } : {}),
    ...(params.replyMarkup ? { reply_markup: params.replyMarkup } : {}),
  };

  const first = await postJson<TelegramSentMessage>('editMessageText', payload);
  if (!first.ok && first.errorCode === 429 && first.retryAfter) {
    const waitMs = Math.min(5000, Math.max(500, first.retryAfter * 1000));
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return postJson<TelegramSentMessage>('editMessageText', payload);
  }
  return first;
}

export async function tgDeleteMessage(
  chatId: string | number,
  messageId: string | number
): Promise<TelegramApiResponse<boolean>> {
  return postJson<boolean>('deleteMessage', {
    chat_id: chatId,
    message_id: Number(messageId),
  });
}

export async function tgAnswerCallbackQuery(params: {
  callbackQueryId: string;
  text?: string;
  showAlert?: boolean;
}): Promise<TelegramApiResponse<boolean>> {
  return postJson<boolean>('answerCallbackQuery', {
    callback_query_id: params.callbackQueryId,
    ...(params.text ? { text: params.text } : {}),
    show_alert: Boolean(params.showAlert),
  });
}

export async function tgSetWebhook(params: {
  url: string;
  secretToken?: string;
}): Promise<TelegramApiResponse<boolean>> {
  return postJson<boolean>('setWebhook', {
    url: params.url,
    ...(params.secretToken ? { secret_token: params.secretToken } : {}),
    allowed_updates: ['message', 'callback_query'],
  });
}

export async function tgSetMyCommands(
  commands: Array<{ command: string; description: string }> = BOT_COMMANDS
): Promise<TelegramApiResponse<boolean>> {
  return postJson<boolean>('setMyCommands', { commands });
}

export async function tgSetMyDescription(
  description: string,
  languageCode?: string
): Promise<TelegramApiResponse<boolean>> {
  return postJson<boolean>('setMyDescription', {
    description,
    ...(languageCode ? { language_code: languageCode } : {}),
  });
}

export async function tgSetMyShortDescription(
  shortDescription: string,
  languageCode?: string
): Promise<TelegramApiResponse<boolean>> {
  return postJson<boolean>('setMyShortDescription', {
    short_description: shortDescription,
    ...(languageCode ? { language_code: languageCode } : {}),
  });
}

export async function tgSetMyProfilePhoto(
  photoBuffer: Buffer,
  filename = 'bot-avatar.jpg'
): Promise<TelegramApiResponse<boolean>> {
  const token = getBotToken();
  if (!token) {
    return { ok: false, description: 'TELEGRAM_BOT_TOKEN is not configured' };
  }

  try {
    const form = new FormData();
    form.append('photo', JSON.stringify({ type: 'static', photo: 'attach://avatar_file' }));
    const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    form.append('avatar_file', new Blob([new Uint8Array(photoBuffer)], { type: mimeType }), filename);

    const res = await fetch(`https://api.telegram.org/bot${token}/setMyProfilePhoto`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(20000),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      result?: boolean;
      description?: string;
      error_code?: number;
      parameters?: { retry_after?: number };
    };
    return {
      ok: Boolean(data.ok),
      result: data.result,
      description: data.description,
      errorCode: data.error_code,
      retryAfter: data.parameters?.retry_after,
    };
  } catch (err) {
    return {
      ok: false,
      description: err instanceof Error ? err.message : 'Telegram network error',
    };
  }
}

export async function tgGetMyDescription(): Promise<TelegramApiResponse<{ description?: string }>> {
  return postJson<{ description?: string }>('getMyDescription', {});
}

export async function tgGetMyShortDescription(): Promise<TelegramApiResponse<{ short_description?: string }>> {
  return postJson<{ short_description?: string }>('getMyShortDescription', {});
}

export async function tgGetMe(): Promise<TelegramApiResponse<{ id: number; username?: string; first_name: string }>> {
  return postJson<{ id: number; username?: string; first_name: string }>('getMe', {});
}

export interface TelegramWebhookInfo {
  url?: string;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
}

export async function tgGetWebhookInfo(): Promise<TelegramApiResponse<TelegramWebhookInfo>> {
  return postJson<TelegramWebhookInfo>('getWebhookInfo', {});
}
