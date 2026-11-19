-- Allow 64-bit photo-based hero avatar on existing Supabase databases
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_avatar_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_avatar_check
  CHECK (avatar IN ('photo_hero', 'fox_orange', 'frog_green', 'cat_amber', 'owl_brown'));
