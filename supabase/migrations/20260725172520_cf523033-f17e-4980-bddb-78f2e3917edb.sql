
REVOKE EXECUTE ON FUNCTION public.tg_profiles_assign_player_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_quests_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_profiles_assign_pioneer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_profiles_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_reserved_username() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pioneer_slots_remaining() FROM anon;
