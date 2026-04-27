
CREATE OR REPLACE FUNCTION public.has_anon_checkin(_place_id uuid, _fingerprint text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.checkins
    WHERE place_id = _place_id
      AND user_id IS NULL
      AND device_fingerprint = _fingerprint
  );
$$;

REVOKE ALL ON FUNCTION public.has_anon_checkin(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_anon_checkin(uuid, text) TO anon, authenticated;
