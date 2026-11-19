-- ============================================================================
-- Migration 004: ASCII CHAOS — Recent Scene History & Scene Attribution
-- ============================================================================

ALTER TABLE public.pairs
  ADD COLUMN IF NOT EXISTS recent_scenes TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.call_events
  ADD COLUMN IF NOT EXISTS scene_id TEXT;
