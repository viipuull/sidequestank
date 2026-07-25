-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.collection_difficulty AS ENUM ('easy','medium','hard','expert');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.collection_visibility AS ENUM ('public','unlisted','private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.collection_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ COLLECTIONS ============
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_image_url text,
  banner_image_url text,
  icon text NOT NULL DEFAULT '📚',
  category text NOT NULL DEFAULT 'adventure',
  collection_type text NOT NULL DEFAULT 'quest_series',
  difficulty public.collection_difficulty NOT NULL DEFAULT 'easy',
  visibility public.collection_visibility NOT NULL DEFAULT 'public',
  status public.collection_status NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  seasonal boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  repeatable boolean NOT NULL DEFAULT false,
  estimated_minutes integer NOT NULL DEFAULT 60,
  display_order integer NOT NULL DEFAULT 100,
  reward_xp integer NOT NULL DEFAULT 0,
  reward_title_id uuid REFERENCES public.titles(id) ON DELETE SET NULL,
  reward_achievement_id uuid REFERENCES public.achievements(id) ON DELETE SET NULL,
  reward_badge_image_url text,
  reward_summary text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  city text NOT NULL DEFAULT 'Ankleshwar',
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public views published public collections" ON public.collections
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND visibility = 'public' AND hidden = false);

CREATE POLICY "Founders view all collections" ON public.collections
  FOR SELECT TO authenticated USING (public.is_founder());
CREATE POLICY "Founders insert collections" ON public.collections
  FOR INSERT TO authenticated WITH CHECK (public.is_founder());
CREATE POLICY "Founders update collections" ON public.collections
  FOR UPDATE TO authenticated USING (public.is_founder()) WITH CHECK (public.is_founder());
CREATE POLICY "Founders delete collections" ON public.collections
  FOR DELETE TO authenticated USING (public.is_founder());

CREATE INDEX IF NOT EXISTS collections_status_visibility_idx ON public.collections (status, visibility, hidden);
CREATE INDEX IF NOT EXISTS collections_featured_idx ON public.collections (featured) WHERE featured = true;

CREATE OR REPLACE FUNCTION public.tg_collections_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS collections_updated_at ON public.collections;
CREATE TRIGGER collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.tg_collections_updated_at();

-- ============ COLLECTION ITEMS ============
CREATE TABLE IF NOT EXISTS public.collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  completion_order integer NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT true,
  unlock_requirement jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, quest_id)
);

GRANT SELECT ON public.collection_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT ALL ON public.collection_items TO service_role;

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public views items of public collections" ON public.collection_items
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_items.collection_id
      AND c.status = 'published' AND c.visibility = 'public' AND c.hidden = false
  ));

CREATE POLICY "Founders manage collection items" ON public.collection_items
  FOR ALL TO authenticated USING (public.is_founder()) WITH CHECK (public.is_founder());

CREATE INDEX IF NOT EXISTS collection_items_collection_idx ON public.collection_items (collection_id, completion_order);
CREATE INDEX IF NOT EXISTS collection_items_quest_idx ON public.collection_items (quest_id);

-- ============ PLAYER COLLECTIONS ============
CREATE TABLE IF NOT EXISTS public.player_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  completed_quests integer NOT NULL DEFAULT 0,
  total_required integer NOT NULL DEFAULT 0,
  percent integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  reward_granted boolean NOT NULL DEFAULT false,
  favorite boolean NOT NULL DEFAULT false,
  pinned boolean NOT NULL DEFAULT false,
  last_progress_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, collection_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_collections TO authenticated;
GRANT ALL ON public.player_collections TO service_role;

ALTER TABLE public.player_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players manage own collection progress" ON public.player_collections
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Founders view all player collections" ON public.player_collections
  FOR SELECT TO authenticated USING (public.is_founder());

CREATE INDEX IF NOT EXISTS player_collections_user_idx ON public.player_collections (user_id, completed);
CREATE INDEX IF NOT EXISTS player_collections_collection_idx ON public.player_collections (collection_id);

DROP TRIGGER IF EXISTS player_collections_updated_at ON public.player_collections;
CREATE TRIGGER player_collections_updated_at
  BEFORE UPDATE ON public.player_collections
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();

-- ============ PROGRESS + REWARD RPC ============
CREATE OR REPLACE FUNCTION public.update_collection_progress_for_user(
  _user_id uuid, _quest_id uuid
)
RETURNS TABLE (
  id uuid, slug text, name text, icon text, cover_image_url text,
  banner_image_url text, reward_xp integer, reward_summary text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c RECORD;
  req_total int;
  done_count int;
  newly_completed uuid[] := ARRAY[]::uuid[];
  rec RECORD;
  cur_thr int;
  next_thr int;
  new_lifetime int;
  new_level int;
  old_level int;
  ach_target int;
BEGIN
  IF _user_id IS NULL OR _quest_id IS NULL THEN RETURN; END IF;

  -- All collections that contain this quest as a required item
  FOR c IN
    SELECT DISTINCT col.id
    FROM public.collections col
    JOIN public.collection_items ci ON ci.collection_id = col.id
    WHERE ci.quest_id = _quest_id
      AND col.status = 'published'
  LOOP
    -- required total for this collection
    SELECT COUNT(*)::int INTO req_total
      FROM public.collection_items WHERE collection_id = c.id AND required = true;

    -- how many required quests this user has completed (via quest_sessions)
    SELECT COUNT(DISTINCT ci.quest_id)::int INTO done_count
      FROM public.collection_items ci
      JOIN public.quest_sessions qs
        ON qs.quest_id = ci.quest_id
       AND qs.user_id = _user_id
       AND qs.status = 'completed'
      WHERE ci.collection_id = c.id AND ci.required = true;

    -- upsert player_collections row
    INSERT INTO public.player_collections (user_id, collection_id, completed_quests, total_required, percent, last_progress_at)
      VALUES (
        _user_id, c.id, done_count, req_total,
        CASE WHEN req_total = 0 THEN 0 ELSE (done_count * 100 / req_total) END,
        now()
      )
      ON CONFLICT (user_id, collection_id) DO UPDATE SET
        completed_quests = EXCLUDED.completed_quests,
        total_required = EXCLUDED.total_required,
        percent = EXCLUDED.percent,
        last_progress_at = now();

    -- Completion transition
    IF req_total > 0 AND done_count >= req_total THEN
      UPDATE public.player_collections
        SET completed = true,
            completed_at = COALESCE(completed_at, now())
        WHERE user_id = _user_id AND collection_id = c.id AND completed = false;

      -- Grant rewards exactly once
      IF NOT EXISTS (
        SELECT 1 FROM public.player_collections
        WHERE user_id = _user_id AND collection_id = c.id AND reward_granted = true
      ) THEN
        -- Reward: XP
        SELECT * INTO rec FROM public.collections WHERE id = c.id;
        IF COALESCE(rec.reward_xp, 0) > 0 THEN
          INSERT INTO public.player_progress (user_id) VALUES (_user_id)
            ON CONFLICT (user_id) DO NOTHING;

          SELECT current_level, lifetime_xp INTO old_level, new_lifetime
            FROM public.player_progress WHERE user_id = _user_id FOR UPDATE;
          new_lifetime := COALESCE(new_lifetime, 0) + rec.reward_xp;
          new_level := public.level_from_total_xp(new_lifetime);
          cur_thr := public.xp_required_for_level(new_level);
          next_thr := public.xp_required_for_level(new_level + 1);

          UPDATE public.player_progress SET
            lifetime_xp = new_lifetime,
            current_level = new_level,
            current_level_xp = new_lifetime - cur_thr,
            xp_for_next_level = GREATEST(1, next_thr - cur_thr),
            level_up_date = CASE WHEN new_level > COALESCE(old_level,1) THEN now() ELSE level_up_date END
          WHERE user_id = _user_id;

          UPDATE public.profiles SET xp = new_lifetime, level = new_level WHERE id = _user_id;

          INSERT INTO public.xp_events (user_id, xp_earned, reason, metadata)
            VALUES (_user_id, rec.reward_xp, 'collection_completed',
              jsonb_build_object('collection_id', c.id, 'collection_slug', rec.slug));
        END IF;

        -- Reward: title
        IF rec.reward_title_id IS NOT NULL THEN
          PERFORM public._grant_title(_user_id, rec.reward_title_id, 'system'::title_source);
        END IF;

        -- Reward: achievement (mark completed)
        IF rec.reward_achievement_id IS NOT NULL THEN
          SELECT COALESCE(goal_target, 1) INTO ach_target
            FROM public.achievements WHERE id = rec.reward_achievement_id;
          INSERT INTO public.player_achievements
            (user_id, achievement_id, progress, target, completed, completed_at, source)
            VALUES (_user_id, rec.reward_achievement_id, ach_target, ach_target, true, now(), 'collection')
            ON CONFLICT (user_id, achievement_id) DO UPDATE SET
              progress = GREATEST(public.player_achievements.progress, EXCLUDED.progress),
              completed = true,
              completed_at = COALESCE(public.player_achievements.completed_at, now());
        END IF;

        UPDATE public.player_collections
          SET reward_granted = true
          WHERE user_id = _user_id AND collection_id = c.id;

        newly_completed := array_append(newly_completed, c.id);
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY
    SELECT cc.id, cc.slug, cc.name, cc.icon, cc.cover_image_url,
           cc.banner_image_url, cc.reward_xp, cc.reward_summary
    FROM public.collections cc
    WHERE cc.id = ANY(newly_completed);
END $$;

-- ============ STORAGE POLICIES for quest-media reused ============
-- (Reusing existing quest-media bucket for collection covers/banners.)
