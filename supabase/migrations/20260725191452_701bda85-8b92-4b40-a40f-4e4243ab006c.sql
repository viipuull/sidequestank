
-- =========================================================================
-- Enums
-- =========================================================================
CREATE TYPE public.leaderboard_scope AS ENUM ('global','country','state','city','event','friends','team');
CREATE TYPE public.leaderboard_period AS ENUM ('all_time','weekly','monthly','seasonal');
CREATE TYPE public.activity_kind AS ENUM ('quest_completed','level_up','title_unlocked','achievement_unlocked','collection_completed');
CREATE TYPE public.activity_visibility AS ENUM ('public','friends','guild','private');

-- =========================================================================
-- player_social_settings
-- =========================================================================
CREATE TABLE public.player_social_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_profile boolean NOT NULL DEFAULT true,
  show_stats boolean NOT NULL DEFAULT true,
  show_achievements boolean NOT NULL DEFAULT true,
  show_collections boolean NOT NULL DEFAULT true,
  show_titles boolean NOT NULL DEFAULT true,
  show_level boolean NOT NULL DEFAULT true,
  show_xp boolean NOT NULL DEFAULT true,
  appear_on_leaderboard boolean NOT NULL DEFAULT true,
  allow_friend_requests boolean NOT NULL DEFAULT true,
  allow_followers boolean NOT NULL DEFAULT true,
  moderation_hidden boolean NOT NULL DEFAULT false,
  bio text,
  banner_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.player_social_settings TO authenticated;
GRANT SELECT ON public.player_social_settings TO anon;
GRANT ALL ON public.player_social_settings TO service_role;

ALTER TABLE public.player_social_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_read" ON public.player_social_settings FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "public_read" ON public.player_social_settings FOR SELECT
  USING (public_profile = true AND moderation_hidden = false);
CREATE POLICY "own_insert" ON public.player_social_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_update" ON public.player_social_settings FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "founder_update" ON public.player_social_settings FOR UPDATE
  USING (public.is_founder()) WITH CHECK (public.is_founder());

CREATE TRIGGER tg_social_settings_updated_at BEFORE UPDATE
  ON public.player_social_settings FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();

-- Auto-create settings row when a profile is created
CREATE OR REPLACE FUNCTION public.tg_profiles_create_social()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.player_social_settings (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER tg_profiles_create_social AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_create_social();

-- Backfill for existing profiles
INSERT INTO public.player_social_settings (user_id)
  SELECT id FROM public.profiles ON CONFLICT DO NOTHING;

-- =========================================================================
-- player_stats
-- =========================================================================
CREATE TABLE public.player_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  quests_completed integer NOT NULL DEFAULT 0,
  collections_completed integer NOT NULL DEFAULT 0,
  achievements_earned integer NOT NULL DEFAULT 0,
  titles_earned integer NOT NULL DEFAULT 0,
  cities_explored integer NOT NULL DEFAULT 0,
  last_active_at timestamptz,
  join_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.player_stats TO anon, authenticated;
GRANT ALL ON public.player_stats TO service_role;

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_read_stats" ON public.player_stats FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "public_read_stats" ON public.player_stats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.player_social_settings s
     WHERE s.user_id = player_stats.user_id
       AND s.public_profile = true AND s.moderation_hidden = false
  ));
CREATE POLICY "founder_read_stats" ON public.player_stats FOR SELECT
  USING (public.is_founder());

CREATE TRIGGER tg_player_stats_updated_at BEFORE UPDATE
  ON public.player_stats FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();

CREATE INDEX ix_player_stats_xp ON public.player_stats (total_xp DESC, level DESC);
CREATE INDEX ix_player_stats_last_active ON public.player_stats (last_active_at DESC NULLS LAST);

-- Recompute helper
CREATE OR REPLACE FUNCTION public.recompute_player_stats(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _xp int := 0;
  _lvl int := 1;
  _quests int := 0;
  _colls int := 0;
  _ach int := 0;
  _titles int := 0;
  _cities int := 0;
  _join timestamptz := now();
BEGIN
  SELECT COALESCE(lifetime_xp,0), COALESCE(current_level,1), COALESCE(total_quests_completed,0)
    INTO _xp, _lvl, _quests
    FROM public.player_progress WHERE user_id = _user_id;
  SELECT COUNT(*) INTO _colls FROM public.player_collections
    WHERE user_id = _user_id AND completed = true;
  SELECT COUNT(*) INTO _ach FROM public.player_achievements
    WHERE user_id = _user_id AND completed = true;
  SELECT COUNT(*) INTO _titles FROM public.player_titles WHERE user_id = _user_id;
  SELECT COUNT(DISTINCT q.city)::int INTO _cities
    FROM public.quest_sessions qs
    JOIN public.quests q ON q.id = qs.quest_id
   WHERE qs.user_id = _user_id AND qs.status = 'completed';
  SELECT created_at INTO _join FROM public.profiles WHERE id = _user_id;

  INSERT INTO public.player_stats
    (user_id, total_xp, level, quests_completed, collections_completed,
     achievements_earned, titles_earned, cities_explored, last_active_at, join_date)
  VALUES
    (_user_id, COALESCE(_xp,0), COALESCE(_lvl,1), COALESCE(_quests,0), COALESCE(_colls,0),
     COALESCE(_ach,0), COALESCE(_titles,0), COALESCE(_cities,0), now(), COALESCE(_join, now()))
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = EXCLUDED.total_xp,
    level = EXCLUDED.level,
    quests_completed = EXCLUDED.quests_completed,
    collections_completed = EXCLUDED.collections_completed,
    achievements_earned = EXCLUDED.achievements_earned,
    titles_earned = EXCLUDED.titles_earned,
    cities_explored = EXCLUDED.cities_explored,
    last_active_at = now();
END; $$;

-- Triggers to auto-refresh player_stats
CREATE OR REPLACE FUNCTION public.tg_touch_player_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  _uid := COALESCE(NEW.user_id, OLD.user_id);
  IF _uid IS NOT NULL THEN PERFORM public.recompute_player_stats(_uid); END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER tg_stats_progress AFTER INSERT OR UPDATE ON public.player_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_player_stats();
CREATE TRIGGER tg_stats_collections AFTER INSERT OR UPDATE ON public.player_collections
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_player_stats();
CREATE TRIGGER tg_stats_achievements AFTER INSERT OR UPDATE ON public.player_achievements
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_player_stats();
CREATE TRIGGER tg_stats_titles AFTER INSERT ON public.player_titles
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_player_stats();

-- Backfill
INSERT INTO public.player_stats (user_id, join_date)
  SELECT id, created_at FROM public.profiles ON CONFLICT DO NOTHING;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recompute_player_stats(r.id);
  END LOOP;
END $$;

-- =========================================================================
-- leaderboard_seasons
-- =========================================================================
CREATE TABLE public.leaderboard_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.leaderboard_seasons TO anon, authenticated;
GRANT ALL ON public.leaderboard_seasons TO service_role;

ALTER TABLE public.leaderboard_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasons_public_read" ON public.leaderboard_seasons FOR SELECT USING (true);
CREATE POLICY "seasons_founder_all" ON public.leaderboard_seasons FOR ALL
  USING (public.is_founder()) WITH CHECK (public.is_founder());

CREATE TRIGGER tg_seasons_updated_at BEFORE UPDATE
  ON public.leaderboard_seasons FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();

INSERT INTO public.leaderboard_seasons (name, slug, active) VALUES ('Season 1 — Origins', 'season-1', true);

-- =========================================================================
-- leaderboard_snapshots
-- =========================================================================
CREATE TABLE public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.leaderboard_scope NOT NULL,
  scope_key text NOT NULL DEFAULT '',
  period public.leaderboard_period NOT NULL,
  period_key text NOT NULL DEFAULT 'all',
  season_id uuid REFERENCES public.leaderboard_seasons(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  quests_completed integer NOT NULL DEFAULT 0,
  collections_completed integer NOT NULL DEFAULT 0,
  achievements_earned integer NOT NULL DEFAULT 0,
  titles_earned integer NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, scope_key, period, period_key, user_id)
);

GRANT SELECT ON public.leaderboard_snapshots TO anon, authenticated;
GRANT ALL ON public.leaderboard_snapshots TO service_role;

ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboard_public_read" ON public.leaderboard_snapshots FOR SELECT USING (true);
CREATE POLICY "leaderboard_founder_all" ON public.leaderboard_snapshots FOR ALL
  USING (public.is_founder()) WITH CHECK (public.is_founder());

CREATE INDEX ix_leaderboard_slice ON public.leaderboard_snapshots (scope, scope_key, period, period_key, rank);
CREATE INDEX ix_leaderboard_user ON public.leaderboard_snapshots (user_id);

-- Compute a leaderboard slice from current player_stats
CREATE OR REPLACE FUNCTION public.compute_leaderboard(
  _scope public.leaderboard_scope,
  _scope_key text,
  _period public.leaderboard_period,
  _period_key text,
  _season_id uuid DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count int := 0;
BEGIN
  DELETE FROM public.leaderboard_snapshots
    WHERE scope = _scope AND scope_key = COALESCE(_scope_key,'')
      AND period = _period AND period_key = COALESCE(_period_key,'all');

  INSERT INTO public.leaderboard_snapshots
    (scope, scope_key, period, period_key, season_id, user_id,
     rank, xp, level, quests_completed, collections_completed,
     achievements_earned, titles_earned)
  SELECT
    _scope, COALESCE(_scope_key,''), _period, COALESCE(_period_key,'all'),
    _season_id,
    ps.user_id,
    ROW_NUMBER() OVER (ORDER BY ps.total_xp DESC, ps.level DESC,
                                ps.quests_completed DESC,
                                ps.collections_completed DESC,
                                ps.join_date ASC),
    ps.total_xp, ps.level, ps.quests_completed, ps.collections_completed,
    ps.achievements_earned, ps.titles_earned
  FROM public.player_stats ps
  JOIN public.profiles pr ON pr.id = ps.user_id
  JOIN public.player_social_settings s ON s.user_id = ps.user_id
  WHERE s.appear_on_leaderboard = true
    AND s.moderation_hidden = false
    AND (_scope <> 'city' OR lower(pr.city) = lower(COALESCE(NULLIF(_scope_key,''),pr.city)));

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END; $$;

-- =========================================================================
-- featured_players
-- =========================================================================
CREATE TABLE public.featured_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blurb text NOT NULL DEFAULT '',
  priority integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT ON public.featured_players TO anon, authenticated;
GRANT ALL ON public.featured_players TO service_role;

ALTER TABLE public.featured_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "featured_public_read" ON public.featured_players FOR SELECT USING (active = true);
CREATE POLICY "featured_founder_all" ON public.featured_players FOR ALL
  USING (public.is_founder()) WITH CHECK (public.is_founder());

CREATE TRIGGER tg_featured_updated_at BEFORE UPDATE
  ON public.featured_players FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();

-- =========================================================================
-- activity_events
-- =========================================================================
CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.activity_kind NOT NULL,
  ref_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility public.activity_visibility NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.activity_events TO anon, authenticated;
GRANT ALL ON public.activity_events TO service_role;

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_public_read" ON public.activity_events FOR SELECT
  USING (
    visibility = 'public'
    AND EXISTS (
      SELECT 1 FROM public.player_social_settings s
      WHERE s.user_id = activity_events.user_id
        AND s.public_profile = true AND s.moderation_hidden = false
    )
  );
CREATE POLICY "activity_own_read" ON public.activity_events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "activity_founder_read" ON public.activity_events FOR SELECT USING (public.is_founder());

CREATE INDEX ix_activity_recent ON public.activity_events (created_at DESC);
CREATE INDEX ix_activity_user_recent ON public.activity_events (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.record_activity_event(
  _user_id uuid, _kind public.activity_kind, _ref_id uuid, _payload jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.activity_events (user_id, kind, ref_id, payload)
    VALUES (_user_id, _kind, _ref_id, COALESCE(_payload,'{}'::jsonb))
    RETURNING id INTO _id;
  RETURN _id;
END; $$;

-- ---- Trigger: XP events → quest_completed / level_up
CREATE OR REPLACE FUNCTION public.tg_xp_events_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q RECORD; prev_level int; new_level int;
BEGIN
  IF NEW.reason = 'quest_completed' AND NEW.quest_id IS NOT NULL THEN
    SELECT title, slug, category, difficulty, city INTO q FROM public.quests WHERE id = NEW.quest_id;
    PERFORM public.record_activity_event(NEW.user_id, 'quest_completed', NEW.quest_id, jsonb_build_object(
      'quest_title', q.title, 'quest_slug', q.slug, 'category', q.category,
      'difficulty', q.difficulty, 'city', q.city, 'xp_earned', NEW.xp_earned
    ));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER tg_xp_events_activity AFTER INSERT ON public.xp_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_xp_events_activity();

CREATE OR REPLACE FUNCTION public.tg_progress_level_up_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.current_level > COALESCE(OLD.current_level, 0) THEN
    PERFORM public.record_activity_event(NEW.user_id, 'level_up', NULL,
      jsonb_build_object('level', NEW.current_level, 'lifetime_xp', NEW.lifetime_xp));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER tg_progress_level_up_activity AFTER UPDATE ON public.player_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_progress_level_up_activity();

CREATE OR REPLACE FUNCTION public.tg_titles_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t RECORD;
BEGIN
  SELECT name, slug, rarity, category, icon, color INTO t FROM public.titles WHERE id = NEW.title_id;
  PERFORM public.record_activity_event(NEW.user_id, 'title_unlocked', NEW.title_id, jsonb_build_object(
    'title_name', t.name, 'title_slug', t.slug, 'rarity', t.rarity,
    'category', t.category, 'icon', t.icon, 'color', t.color
  ));
  RETURN NEW;
END; $$;

CREATE TRIGGER tg_titles_activity AFTER INSERT ON public.player_titles
  FOR EACH ROW EXECUTE FUNCTION public.tg_titles_activity();

CREATE OR REPLACE FUNCTION public.tg_achievements_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a RECORD;
BEGIN
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    SELECT name, slug, rarity, category, icon, color, badge_image_url
      INTO a FROM public.achievements WHERE id = NEW.achievement_id;
    PERFORM public.record_activity_event(NEW.user_id, 'achievement_unlocked', NEW.achievement_id, jsonb_build_object(
      'name', a.name, 'slug', a.slug, 'rarity', a.rarity, 'category', a.category,
      'icon', a.icon, 'color', a.color, 'badge_image_url', a.badge_image_url
    ));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER tg_achievements_activity AFTER INSERT OR UPDATE ON public.player_achievements
  FOR EACH ROW EXECUTE FUNCTION public.tg_achievements_activity();

CREATE OR REPLACE FUNCTION public.tg_collections_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c RECORD;
BEGIN
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    SELECT name, slug, icon, cover_image_url INTO c FROM public.collections WHERE id = NEW.collection_id;
    PERFORM public.record_activity_event(NEW.user_id, 'collection_completed', NEW.collection_id, jsonb_build_object(
      'name', c.name, 'slug', c.slug, 'icon', c.icon, 'cover_image_url', c.cover_image_url
    ));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER tg_collections_activity AFTER INSERT OR UPDATE ON public.player_collections
  FOR EACH ROW EXECUTE FUNCTION public.tg_collections_activity();

-- =========================================================================
-- Helper: recompute default leaderboards
-- =========================================================================
CREATE OR REPLACE FUNCTION public.recompute_default_leaderboards()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

SELECT public.recompute_default_leaderboards();
