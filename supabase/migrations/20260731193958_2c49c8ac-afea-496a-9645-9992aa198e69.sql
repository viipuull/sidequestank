-- 1) Ensure-fresh leaderboard RPC (compute if missing or stale)
CREATE OR REPLACE FUNCTION public.ensure_leaderboard(
  _scope leaderboard_scope,
  _scope_key text,
  _period leaderboard_period,
  _period_key text,
  _max_age_seconds integer DEFAULT 120
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _last timestamptz; _season uuid;
BEGIN
  SELECT max(computed_at) INTO _last
    FROM public.leaderboard_snapshots
   WHERE scope = _scope AND scope_key = COALESCE(_scope_key,'')
     AND period = _period AND period_key = COALESCE(_period_key,'all');

  IF _last IS NOT NULL AND _last > now() - make_interval(secs => GREATEST(10, COALESCE(_max_age_seconds,120))) THEN
    RETURN;
  END IF;

  IF _period = 'seasonal' THEN
    SELECT id INTO _season FROM public.leaderboard_seasons
     WHERE active = true ORDER BY starts_at DESC LIMIT 1;
  END IF;

  PERFORM public.compute_leaderboard(_scope, COALESCE(_scope_key,''), _period, COALESCE(_period_key,'all'), _season);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_leaderboard(leaderboard_scope, text, leaderboard_period, text, integer) TO anon, authenticated, service_role;

-- 2) Recompute default boards whenever XP is awarded (throttled)
CREATE OR REPLACE FUNCTION public.tg_xp_events_refresh_leaderboards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _last timestamptz;
BEGIN
  PERFORM public.recompute_player_stats(NEW.user_id);

  SELECT max(computed_at) INTO _last FROM public.leaderboard_snapshots;
  IF _last IS NULL OR _last < now() - interval '15 seconds' THEN
    PERFORM public.recompute_default_leaderboards();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS xp_events_refresh_leaderboards ON public.xp_events;
CREATE TRIGGER xp_events_refresh_leaderboards
AFTER INSERT ON public.xp_events
FOR EACH ROW EXECUTE FUNCTION public.tg_xp_events_refresh_leaderboards();

-- 3) Every new profile gets progress + stats rows
CREATE OR REPLACE FUNCTION public.tg_profiles_bootstrap_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.player_progress (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  PERFORM public.recompute_player_stats(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_bootstrap_progress ON public.profiles;
CREATE TRIGGER profiles_bootstrap_progress
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_bootstrap_progress();

-- 4) Seasonal board must not break without an active season
CREATE OR REPLACE FUNCTION public.recompute_default_leaderboards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _season uuid; _city text;
BEGIN
  SELECT id INTO _season FROM public.leaderboard_seasons WHERE active = true ORDER BY starts_at DESC LIMIT 1;
  PERFORM public.compute_leaderboard('global','','all_time','all', NULL);
  PERFORM public.compute_leaderboard('global','','weekly', to_char(now(),'IYYY-"W"IW'), NULL);
  PERFORM public.compute_leaderboard('global','','monthly', to_char(now(),'YYYY-MM'), NULL);
  PERFORM public.compute_leaderboard('global','','seasonal','current', _season);
  FOR _city IN SELECT DISTINCT lower(city) FROM public.profiles WHERE city IS NOT NULL AND city <> '' LOOP
    PERFORM public.compute_leaderboard('city', _city, 'all_time','all', NULL);
  END LOOP;
END;
$$;