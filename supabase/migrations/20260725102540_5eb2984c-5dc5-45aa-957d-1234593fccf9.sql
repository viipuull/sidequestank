
CREATE OR REPLACE FUNCTION public.pioneer_slots_remaining()
RETURNS INTEGER LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT GREATEST(0, 25 - (SELECT COUNT(*)::int FROM public.profiles WHERE is_pioneer = true));
$$;

REVOKE ALL ON FUNCTION public.enforce_reserved_username() FROM PUBLIC, anon, authenticated;
