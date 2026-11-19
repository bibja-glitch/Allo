-- ============================================================================
-- АЛЛО, РОУД! — Pixel Fatality (Telegram Bot)
-- Full Consolidated Supabase PostgreSQL Schema
-- Paste and run in Supabase -> SQL Editor -> New Query
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Telegram User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 32),
  avatar TEXT NOT NULL DEFAULT 'photo_hero' CHECK (avatar IN ('photo_hero', 'fox_orange', 'frog_green', 'cat_amber', 'owl_brown')),
  telegram_id TEXT UNIQUE,
  telegram_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id
  ON public.profiles (telegram_id);

-- 2. Pairs (Strictly 2 friends per pair)
CREATE TABLE IF NOT EXISTS public.pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active')),
  finish_threshold INTEGER NOT NULL DEFAULT 10 CHECK (finish_threshold BETWEEN 3 AND 50),
  cooldown_seconds INTEGER NOT NULL DEFAULT 60 CHECK (cooldown_seconds BETWEEN 0 AND 600),
  custom_ranks JSONB,
  group_chat_id TEXT,
  last_animation_file TEXT,
  recent_scenes TEXT[] NOT NULL DEFAULT '{}',
  round_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Pair Members (Max 2 members enforced by trigger)
CREATE TABLE IF NOT EXISTS public.pair_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES public.pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lane_index SMALLINT NOT NULL CHECK (lane_index IN (0, 1)),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pair_id, user_id),
  UNIQUE (pair_id, lane_index)
);

CREATE OR REPLACE FUNCTION public.enforce_max_two_pair_members()
RETURNS TRIGGER AS $$
DECLARE
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM public.pair_members
  WHERE pair_id = NEW.pair_id;

  IF member_count >= 2 THEN
    RAISE EXCEPTION 'Pair already has 2 members (maximum allowed)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_max_two_pair_members ON public.pair_members;
CREATE TRIGGER trg_enforce_max_two_pair_members
  BEFORE INSERT ON public.pair_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_two_pair_members();

-- 4. Call Events & Fatality Animation Lifecycle
CREATE TABLE IF NOT EXISTS public.call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES public.pairs(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'missed_call' CHECK (event_type IN ('missed_call', 'callback')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed', 'cancelled')),
  steps_awarded INTEGER NOT NULL DEFAULT 1 CHECK (steps_awarded IN (0, 1)),
  note TEXT,
  target_chat_id TEXT,
  scene_id TEXT,
  animation_file TEXT,
  animation_message_id TEXT,
  animation_expires_at TIMESTAMPTZ,
  animation_deleted_at TIMESTAMPTZ,
  result_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  idempotency_key TEXT NOT NULL,
  CHECK (actor_id <> recipient_id),
  UNIQUE (pair_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_call_events_pair_created
  ON public.call_events (pair_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_events_pending_cleanup
  ON public.call_events (animation_expires_at)
  WHERE animation_message_id IS NOT NULL AND animation_deleted_at IS NULL;

-- 5. Bot Connections (Private Telegram chat IDs)
CREATE TABLE IF NOT EXISTS public.bot_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL UNIQUE,
  link_token TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notification_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- 6. Webhook Update Deduplication (prevents double-processing on Telegram retries)
CREATE TABLE IF NOT EXISTS public.webhook_updates (
  update_id BIGINT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (Server accesses via SUPABASE_SERVICE_ROLE_KEY)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pair_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_updates ENABLE ROW LEVEL SECURITY;
