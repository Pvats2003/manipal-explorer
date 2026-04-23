
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS batch_year integer,
  ADD COLUMN IF NOT EXISTS profile_emoji text NOT NULL DEFAULT '🌴',
  ADD COLUMN IF NOT EXISTS explorer_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

-- Bucket list completions (cloud-synced)
CREATE TABLE IF NOT EXISTS public.bucket_list_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

ALTER TABLE public.bucket_list_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bucket completions"
  ON public.bucket_list_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own bucket completions"
  ON public.bucket_list_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own bucket completions"
  ON public.bucket_list_completions FOR DELETE
  USING (auth.uid() = user_id);

-- Trip logs (cloud-synced)
CREATE TABLE IF NOT EXISTS public.trip_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  destination_name text NOT NULL,
  date_visited date,
  spent numeric NOT NULL DEFAULT 0,
  rating integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trip logs"
  ON public.trip_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own trip logs"
  ON public.trip_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own trip logs"
  ON public.trip_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own trip logs"
  ON public.trip_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trip_logs_updated_at
  BEFORE UPDATE ON public.trip_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
