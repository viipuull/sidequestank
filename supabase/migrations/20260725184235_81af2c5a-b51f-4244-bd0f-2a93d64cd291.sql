-- =========================================
-- ENUMS
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.title_rarity AS ENUM ('common','uncommon','rare','epic','legendary','mythic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.title_category AS ENUM ('explorer','adventure','completion','founder','seasonal','event','special','community','hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.title_unlock_type AS ENUM (
    'reach_level',
    'quest_count',
    'specific_quest',
    'pioneer',
    'founder',
    'manual',
    'event'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.title_source AS ENUM ('auto','founder','event','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================
-- TITLES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category public.title_category NOT NULL DEFAULT 'explorer',
  rarity public.title_rarity NOT NULL DEFAULT 'common',
  icon TEXT NOT NULL DEFAULT '🏷️',
  color TEXT NOT NULL DEFAULT 'oklch(0.72 0.16 300)',
  unlock_type public.title_unlock_type NOT NULL DEFAULT 'manual',
  unlock_requirement JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.titles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.titles TO authenticated;
GRANT ALL ON public.titles TO service_role;

ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Titles: public read active"
  ON public.titles FOR SELECT TO anon, authenticated
  USING (active = true AND hidden = false);

CREATE POLICY "Titles: founder full read"
  ON public.titles FOR SELECT TO authenticated
  USING (public.is_founder());

CREATE POLICY "Titles: founder insert"
  ON public.titles FOR INSERT TO authenticated
  WITH CHECK (public.is_founder());

CREATE POLICY "Titles: founder update"
  ON public.titles FOR UPDATE TO authenticated
  USING (public.is_founder()) WITH CHECK (public.is_founder());

CREATE POLICY "Titles: founder delete"
  ON public.titles FOR DELETE TO authenticated
  USING (public.is_founder());

CREATE OR REPLACE FUNCTION public.tg_titles_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_titles_updated_at ON public.titles;
CREATE TRIGGER trg_titles_updated_at BEFORE UPDATE ON public.titles
  FOR EACH ROW EXECUTE FUNCTION public.tg_titles_updated_at();

-- =========================================
-- PLAYER TITLES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.player_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_id UUID NOT NULL REFERENCES public.titles(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  equipped BOOLEAN NOT NULL DEFAULT false,
  source public.title_source NOT NULL DEFAULT 'auto',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, title_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS player_titles_one_equipped
  ON public.player_titles (user_id) WHERE equipped = true;

CREATE INDEX IF NOT EXISTS player_titles_user_idx ON public.player_titles(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_titles TO authenticated;
GRANT ALL ON public.player_titles TO service_role;

ALTER TABLE public.player_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PlayerTitles: read own"
  ON public.player_titles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_founder());

-- Equip/unequip via RPC only (no direct writes from clients).
CREATE POLICY "PlayerTitles: founder write"
  ON public.player_titles FOR ALL TO authenticated
  USING (public.is_founder()) WITH CHECK (public.is_founder());

-- =========================================
-- SEED TITLES
-- =========================================
INSERT INTO public.titles (name, slug, description, category, rarity, icon, color, unlock_type, unlock_requirement, display_order, hidden)
VALUES
  ('Founder', 'founder', 'Original architect of SideQuest.', 'founder', 'mythic', '👑', 'oklch(0.85 0.16 85)', 'founder', '{}'::jsonb, 0, false),
  ('Pioneer', 'pioneer', 'One of the first 25 explorers to join SideQuest.', 'special', 'legendary', '🏆', 'oklch(0.82 0.16 85)', 'pioneer', '{}'::jsonb, 1, false),
  ('First Steps', 'first-steps', 'Completed your very first quest.', 'completion', 'common', '👣', 'oklch(0.78 0.14 155)', 'quest_count', '{"count": 1}'::jsonb, 10, false),
  ('Rookie Explorer', 'rookie-explorer', 'Reached Level 5.', 'explorer', 'uncommon', '🧭', 'oklch(0.72 0.16 220)', 'reach_level', '{"level": 5}'::jsonb, 20, false),
  ('Trailblazer', 'trailblazer', 'Reached Level 10.', 'explorer', 'rare', '🔥', 'oklch(0.72 0.19 40)', 'reach_level', '{"level": 10}'::jsonb, 21, false),
  ('Pathfinder', 'pathfinder', 'Reached Level 25.', 'explorer', 'epic', '🗺️', 'oklch(0.72 0.20 300)', 'reach_level', '{"level": 25}'::jsonb, 22, false),
  ('Legend of Ankleshwar', 'legend-of-ankleshwar', 'Reached Level 50.', 'explorer', 'legendary', '⭐', 'oklch(0.85 0.18 75)', 'reach_level', '{"level": 50}'::jsonb, 23, false),
  ('Dedicated Adventurer', 'dedicated-adventurer', 'Completed 25 quests.', 'adventure', 'rare', '🎯', 'oklch(0.72 0.16 155)', 'quest_count', '{"count": 25}'::jsonb, 30, false),
  ('Master Explorer', 'master-explorer', 'Completed 100 quests.', 'adventure', 'epic', '🏅', 'oklch(0.78 0.18 60)', 'quest_count', '{"count": 100}'::jsonb, 31, false)
ON CONFLICT (slug) DO NOTHING;

-- =========================================
-- UNLOCK / EQUIP RPCs
-- =========================================

-- Grant a title to a user (idempotent). Returns true when newly granted.
CREATE OR REPLACE FUNCTION public._grant_title(_user_id UUID, _title_id UUID, _source public.title_source)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE inserted BOOLEAN := false;
BEGIN
  INSERT INTO public.player_titles (user_id, title_id, source)
  VALUES (_user_id, _title_id, _source)
  ON CONFLICT (user_id, title_id) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;

-- Evaluate and grant automatic titles for a user based on current progression.
-- Returns list of newly-unlocked titles.
CREATE OR REPLACE FUNCTION public.evaluate_titles_for_user(_user_id UUID)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  description TEXT,
  rarity public.title_rarity,
  category public.title_category,
  icon TEXT,
  color TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _level INT := 1;
  _quests INT := 0;
  _is_pioneer BOOLEAN := false;
  _email TEXT;
  t RECORD;
  new_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(pp.current_level, 1), COALESCE(pp.total_quests_completed, 0)
    INTO _level, _quests
  FROM public.player_progress pp WHERE pp.user_id = _user_id;

  SELECT is_pioneer INTO _is_pioneer FROM public.profiles WHERE profiles.id = _user_id;
  SELECT lower(email) INTO _email FROM auth.users WHERE auth.users.id = _user_id;

  FOR t IN
    SELECT titles.* FROM public.titles
    WHERE active = true
      AND unlock_type IN ('reach_level','quest_count','founder','pioneer')
  LOOP
    IF (t.unlock_type = 'reach_level'
        AND _level >= COALESCE((t.unlock_requirement->>'level')::int, 999999)) OR
       (t.unlock_type = 'quest_count'
        AND _quests >= COALESCE((t.unlock_requirement->>'count')::int, 999999)) OR
       (t.unlock_type = 'founder' AND _email = 'ankleshwarweb@gmail.com') OR
       (t.unlock_type = 'pioneer' AND COALESCE(_is_pioneer,false) = true)
    THEN
      IF public._grant_title(_user_id, t.id, 'auto') THEN
        new_ids := array_append(new_ids, t.id);
      END IF;
    END IF;
  END LOOP;

  -- If no title equipped, auto-equip the highest-rarity newly-unlocked one.
  IF NOT EXISTS (SELECT 1 FROM public.player_titles WHERE user_id = _user_id AND equipped = true) THEN
    PERFORM public.equip_highest_owned_title(_user_id);
  END IF;

  RETURN QUERY
    SELECT tt.id, tt.slug, tt.name, tt.description, tt.rarity, tt.category, tt.icon, tt.color
    FROM public.titles tt WHERE tt.id = ANY(new_ids)
    ORDER BY array_position(new_ids, tt.id);
END;
$$;

-- Equip a specific title for the calling user (must own it).
CREATE OR REPLACE FUNCTION public.equip_title(_title_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.player_titles WHERE user_id = _uid AND title_id = _title_id) THEN
    RAISE EXCEPTION 'You do not own this title';
  END IF;
  UPDATE public.player_titles SET equipped = false
    WHERE user_id = _uid AND equipped = true AND title_id <> _title_id;
  UPDATE public.player_titles SET equipped = true
    WHERE user_id = _uid AND title_id = _title_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.unequip_all_titles()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.player_titles SET equipped = false WHERE user_id = _uid;
  RETURN true;
END;
$$;

-- Helper: equip the highest-rarity owned title (used on first unlock).
CREATE OR REPLACE FUNCTION public.equip_highest_owned_title(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _pick UUID;
BEGIN
  SELECT pt.title_id INTO _pick
  FROM public.player_titles pt
  JOIN public.titles t ON t.id = pt.title_id
  WHERE pt.user_id = _user_id
  ORDER BY
    CASE t.rarity
      WHEN 'mythic' THEN 6
      WHEN 'legendary' THEN 5
      WHEN 'epic' THEN 4
      WHEN 'rare' THEN 3
      WHEN 'uncommon' THEN 2
      ELSE 1
    END DESC,
    pt.unlocked_at ASC
  LIMIT 1;
  IF _pick IS NOT NULL THEN
    UPDATE public.player_titles SET equipped = true
    WHERE user_id = _user_id AND title_id = _pick;
  END IF;
END;
$$;

-- Founder-only: assign a title to any user.
CREATE OR REPLACE FUNCTION public.assign_title(_user_id UUID, _title_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_founder() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  PERFORM public._grant_title(_user_id, _title_id, 'founder');
  RETURN true;
END;
$$;

-- Founder-only: remove a title from a user.
CREATE OR REPLACE FUNCTION public.remove_title(_user_id UUID, _title_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_founder() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.player_titles WHERE user_id = _user_id AND title_id = _title_id;
  RETURN true;
END;
$$;

-- Grant execute on the RPCs used by clients.
GRANT EXECUTE ON FUNCTION public.evaluate_titles_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equip_title(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unequip_all_titles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_title(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_title(UUID, UUID) TO authenticated;