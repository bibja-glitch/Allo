-- ============================================================================
-- АЛЛО, РОУД! — Supabase PostgreSQL Schema & Row Level Security Migration
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New Query)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 32),
  avatar TEXT NOT NULL DEFAULT 'photo_hero' CHECK (avatar IN ('photo_hero', 'fox_orange', 'frog_green', 'cat_amber', 'owl_brown')),
  telegram_id TEXT UNIQUE,
  telegram_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Pairs (Strictly 2 friends per pair)
CREATE TABLE IF NOT EXISTS public.pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active')),
  finish_threshold INTEGER NOT NULL DEFAULT 10 CHECK (finish_threshold BETWEEN 3 AND 50),
  cooldown_seconds INTEGER NOT NULL DEFAULT 120 CHECK (cooldown_seconds BETWEEN 0 AND 600),
  custom_ranks JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Pair Members (Uniqueness + strictly max 2 members per pair)
CREATE TABLE IF NOT EXISTS public.pair_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES public.pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lane_index SMALLINT NOT NULL CHECK (lane_index IN (0, 1)),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pair_id, user_id),
  UNIQUE (pair_id, lane_index)
);

-- Trigger to strictly enforce max 2 members in any pair
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

-- 4. Call Events (Progress is computed strictly from confirmed rows)
CREATE TABLE IF NOT EXISTS public.call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES public.pairs(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'missed_call' CHECK (event_type IN ('missed_call', 'callback')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed', 'cancelled')),
  steps_awarded INTEGER NOT NULL DEFAULT 1 CHECK (steps_awarded IN (0, 1)),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  idempotency_key TEXT NOT NULL,
  CHECK (actor_id <> recipient_id),
  UNIQUE (pair_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_call_events_pair_created
  ON public.call_events (pair_id, created_at DESC);

-- 5. Bot Connections (Telegram chat IDs for personal notifications)
CREATE TABLE IF NOT EXISTS public.bot_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL UNIQUE,
  link_token TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notification_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pair_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_connections ENABLE ROW LEVEL SECURITY;

-- Helper function: current profile id for authenticated Supabase user
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: users can view profiles in their own pair, and update only their own profile
CREATE POLICY "profiles_select_pair" ON public.profiles
  FOR SELECT USING (
    id = public.current_profile_id()
    OR EXISTS (
      SELECT 1 FROM public.pair_members pm1
      JOIN public.pair_members pm2 ON pm1.pair_id = pm2.pair_id
      WHERE pm1.user_id = public.current_profile_id()
        AND pm2.user_id = profiles.id
    )
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = public.current_profile_id())
  WITH CHECK (id = public.current_profile_id());

-- Pairs: only members of the pair can read or update settings
CREATE POLICY "pairs_select_member" ON public.pairs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pair_members pm
      WHERE pm.pair_id = pairs.id
        AND pm.user_id = public.current_profile_id()
    )
  );

CREATE POLICY "pairs_update_member" ON public.pairs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pair_members pm
      WHERE pm.pair_id = pairs.id
        AND pm.user_id = public.current_profile_id()
    )
  );

-- Pair Members: visible only to members of the same pair
CREATE POLICY "pair_members_select" ON public.pair_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pair_members pm
      WHERE pm.pair_id = pair_members.pair_id
        AND pm.user_id = public.current_profile_id()
    )
  );

-- Call Events: strictly read-only for clients; writes go through Server API (Service Role)
-- so recipient_id and cooldown/idempotency can never be forged by a browser request!
CREATE POLICY "call_events_select_pair" ON public.call_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pair_members pm
      WHERE pm.pair_id = call_events.pair_id
        AND pm.user_id = public.current_profile_id()
    )
  );

-- Bot Connections: only visible/editable by owner
CREATE POLICY "bot_connections_select_own" ON public.bot_connections
  FOR SELECT USING (user_id = public.current_profile_id());

CREATE POLICY "bot_connections_update_own" ON public.bot_connections
  FOR UPDATE USING (user_id = public.current_profile_id());
