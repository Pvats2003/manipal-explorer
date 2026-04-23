
CREATE TABLE public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  user_id uuid,
  device_fingerprint text,
  checked_in_at timestamptz NOT NULL DEFAULT now()
);

-- Dedup: one check-in per logged-in user per place
CREATE UNIQUE INDEX checkins_user_place_unique
  ON public.checkins (user_id, place_id)
  WHERE user_id IS NOT NULL;

-- Dedup: one check-in per anonymous device per place
CREATE UNIQUE INDEX checkins_device_place_unique
  ON public.checkins (device_fingerprint, place_id)
  WHERE user_id IS NULL AND device_fingerprint IS NOT NULL;

-- Helpful indexes for counts / sort / trending
CREATE INDEX checkins_place_idx ON public.checkins (place_id);
CREATE INDEX checkins_recent_idx ON public.checkins (checked_in_at DESC);

-- Sanity check: must have either a user or a device fingerprint
ALTER TABLE public.checkins
  ADD CONSTRAINT checkins_identity_required
  CHECK (user_id IS NOT NULL OR device_fingerprint IS NOT NULL);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Anyone can read check-ins (counts, recently checked-in feed, trending)
CREATE POLICY "Checkins viewable by everyone"
  ON public.checkins FOR SELECT
  USING (true);

-- Logged-in users insert check-ins tied to themselves
CREATE POLICY "Users insert own checkins"
  ON public.checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anonymous (no auth) check-ins must have no user_id and a fingerprint
CREATE POLICY "Anonymous insert checkins"
  ON public.checkins FOR INSERT
  WITH CHECK (user_id IS NULL AND device_fingerprint IS NOT NULL);

-- Users can remove their own check-ins
CREATE POLICY "Users delete own checkins"
  ON public.checkins FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can clean up
CREATE POLICY "Admins delete any checkin"
  ON public.checkins FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkins;
ALTER TABLE public.checkins REPLICA IDENTITY FULL;
