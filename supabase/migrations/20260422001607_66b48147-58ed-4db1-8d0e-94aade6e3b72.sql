
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS taste_profile jsonb;
