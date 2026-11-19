-- ============================================================================
-- АЛЛО, РОУД! — Pixel Fatality (Telegram Bot)
-- Migration 003: Telegram-first schema, group chat binding, Fatality animation tracking & webhook deduplication
-- ============================================================================

ALTER TABLE public.pairs
  ADD COLUMN IF NOT EXISTS group_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS last_animation_file TEXT,
  ADD COLUMN IF NOT EXISTS round_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.call_events
  ADD COLUMN IF NOT EXISTS target_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS animation_file TEXT,
  ADD COLUMN IF NOT EXISTS animation_message_id TEXT,
  ADD COLUMN IF NOT EXISTS animation_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS animation_deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS result_message_id TEXT;

CREATE TABLE IF NOT EXISTS public.webhook_updates (
  update_id BIGINT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_events_pending_cleanup
  ON public.call_events (animation_expires_at)
  WHERE animation_message_id IS NOT NULL AND animation_deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id
  ON public.profiles (telegram_id);
