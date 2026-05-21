-- RLS policies invoke these helpers as the caller's role, so PostgREST needs EXECUTE.
-- The functions are SECURITY DEFINER + STABLE so they remain safe to expose.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO anon, authenticated;
