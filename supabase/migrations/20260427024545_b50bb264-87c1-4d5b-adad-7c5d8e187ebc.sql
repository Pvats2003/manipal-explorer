
-- 1) CHECKINS: hide device_fingerprint from public reads via column-level revoke
REVOKE SELECT ON public.checkins FROM anon, authenticated;
GRANT SELECT (id, user_id, place_id, checked_in_at) ON public.checkins TO anon, authenticated;

-- 2) PROFILES: restrict to authenticated only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 3) EXPLORER POINTS: lock down inserts, route through SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Users insert own explorer events" ON public.explorer_events;

-- Server-side fixed point table
CREATE TABLE IF NOT EXISTS public.explorer_event_points (
  event_type text PRIMARY KEY,
  points integer NOT NULL CHECK (points BETWEEN 0 AND 100)
);
ALTER TABLE public.explorer_event_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event points viewable by everyone"
  ON public.explorer_event_points FOR SELECT USING (true);

INSERT INTO public.explorer_event_points (event_type, points) VALUES
  ('checkin', 10),
  ('photo_upload', 25),
  ('tip_upvoted', 15),
  ('bucket_complete', 5),
  ('itinerary_saved', 5),
  ('submission_approved', 50)
ON CONFLICT (event_type) DO UPDATE SET points = EXCLUDED.points;

-- RPC: only the calling user can log their own event; points are server-determined.
CREATE OR REPLACE FUNCTION public.log_explorer_event(
  _event_type text,
  _reference_id uuid DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _points integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  SELECT points INTO _points FROM public.explorer_event_points WHERE event_type = _event_type;
  IF _points IS NULL THEN
    RAISE EXCEPTION 'invalid event type: %', _event_type;
  END IF;
  INSERT INTO public.explorer_events (user_id, event_type, points_awarded, reference_id)
  VALUES (_uid, _event_type, _points, _reference_id);
  RETURN _points;
END;
$$;

REVOKE ALL ON FUNCTION public.log_explorer_event(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_explorer_event(text, uuid) TO authenticated;

-- 4) USER BADGES: lock down inserts, route through eligibility-checked RPC
DROP POLICY IF EXISTS "Users insert own badges" ON public.user_badges;

CREATE OR REPLACE FUNCTION public.claim_badge(_badge_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _eligible boolean := false;
  _checkins integer;
  _beach integer;
  _photos integer;
  _bucket integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- already has it?
  IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = _uid AND badge_id = _badge_id) THEN
    RETURN false;
  END IF;

  IF _badge_id = 'explorer' THEN
    SELECT count(*) INTO _checkins FROM public.checkins WHERE user_id = _uid;
    _eligible := _checkins >= 1;
  ELSIF _badge_id = 'adventurer' THEN
    SELECT count(*) INTO _checkins FROM public.checkins WHERE user_id = _uid;
    _eligible := _checkins >= 10;
  ELSIF _badge_id = 'beach' THEN
    SELECT count(*) INTO _beach
      FROM public.checkins c
      JOIN public.destinations d ON d.id = c.place_id
      WHERE c.user_id = _uid AND d.category ILIKE '%beach%';
    _eligible := _beach >= 5;
  ELSIF _badge_id = 'photographer' THEN
    SELECT count(*) INTO _photos
      FROM public.explorer_events
      WHERE user_id = _uid AND event_type = 'photo_upload';
    _eligible := _photos >= 5;
  ELSIF _badge_id = 'legend' THEN
    SELECT count(*) INTO _bucket FROM public.bucket_list_completions WHERE user_id = _uid;
    _eligible := _bucket >= 45;
  ELSIF _badge_id = 'owl' THEN
    SELECT count(*) INTO _checkins
      FROM public.checkins
      WHERE user_id = _uid
        AND (extract(hour from checked_in_at) >= 22 OR extract(hour from checked_in_at) < 4);
    _eligible := _checkins >= 5;
  ELSIF _badge_id = 'sage' THEN
    -- Currently no server-tracked source; deny until tracked.
    _eligible := false;
  ELSE
    RAISE EXCEPTION 'unknown badge: %', _badge_id;
  END IF;

  IF NOT _eligible THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_badges (user_id, badge_id) VALUES (_uid, _badge_id)
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_badge(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_badge(text) TO authenticated;

-- 5) STORAGE: submissions bucket — require auth for uploads, restrict listing
DROP POLICY IF EXISTS "Anyone can upload submission images" ON storage.objects;
DROP POLICY IF EXISTS "Public read submission images" ON storage.objects;

CREATE POLICY "Authenticated users upload submission images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'submissions');

-- Keep public read of individual files (bucket is public for image URLs)
-- but listing is implicit when SELECT is allowed; restrict listing by limiting SELECT to
-- specific known-name reads. Simplest: keep public SELECT (needed for public image URLs)
-- and accept that listing exists for this bucket. Mark bucket public-read intentionally.
CREATE POLICY "Public read submission images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'submissions');

-- 6) Tighten EXECUTE on internal SECURITY DEFINER helpers — they only need to be callable
-- from RLS policies, which run as the table owner, not from PostgREST.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bump_explorer_score() FROM anon, authenticated, PUBLIC;
