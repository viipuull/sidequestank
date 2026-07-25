-- =============== ENUM ===============
CREATE TYPE public.achievement_rarity AS ENUM ('common','uncommon','rare','epic','legendary','mythic');

-- =============== achievements ===============
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  badge_image_url TEXT,
  icon TEXT NOT NULL DEFAULT '🏅',
  color TEXT,
  category TEXT NOT NULL DEFAULT 'explorer',
  difficulty TEXT NOT NULL DEFAULT 'easy',
  rarity public.achievement_rarity NOT NULL DEFAULT 'common',
  unlock_type TEXT NOT NULL DEFAULT 'manual',
  unlock_requirement JSONB NOT NULL DEFAULT '{}'::jsonb,
  goal_target INT NOT NULL DEFAULT 1,
  hidden BOOLEAN NOT NULL DEFAULT false,
  secret BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  xp_bonus INT NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 100,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX achievements_active_idx ON public.achievements (active, display_order);
CREATE INDEX achievements_category_idx ON public.achievements (category);

GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view active achievements"
  ON public.achievements FOR SELECT
  USING (active = true OR public.is_founder());

CREATE POLICY "Founders manage achievements"
  ON public.achievements FOR ALL
  TO authenticated
  USING (public.is_founder())
  WITH CHECK (public.is_founder());

CREATE TRIGGER tg_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();

-- =============== player_achievements ===============
CREATE TABLE public.player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress INT NOT NULL DEFAULT 0,
  target INT NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  reward_granted BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  featured_order INT NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'auto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
CREATE INDEX player_achievements_user_idx ON public.player_achievements (user_id, completed);
CREATE INDEX player_achievements_featured_idx ON public.player_achievements (user_id, featured, featured_order);

GRANT SELECT, INSERT, UPDATE ON public.player_achievements TO authenticated;
GRANT ALL ON public.player_achievements TO service_role;
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;

-- Players may read their own; founders read all.
CREATE POLICY "Players view own achievements"
  ON public.player_achievements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_founder());

-- Players may pin/unpin their own rows; the unlock engine (SECURITY DEFINER)
-- performs inserts server-side.
CREATE POLICY "Players update own pins"
  ON public.player_achievements FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Founders manage player achievements"
  ON public.player_achievements FOR ALL
  TO authenticated
  USING (public.is_founder())
  WITH CHECK (public.is_founder());

CREATE TRIGGER tg_player_achievements_updated_at
  BEFORE UPDATE ON public.player_achievements
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();

-- =============== ENGINE ===============
-- Evaluate every active achievement for a given user, upsert progress, and
-- mark completed. Returns only newly-completed achievements this call.
CREATE OR REPLACE FUNCTION public.evaluate_achievements_for_user(_user_id UUID)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a RECORD;
  progress_val INT;
  target_val INT;
  already_completed BOOLEAN;
  is_now_complete BOOLEAN;
  prog RECORD;
  quest_count INT;
  player_level INT;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;

  -- Snapshot progression numbers once.
  SELECT COALESCE(pp.current_level, p.level, 1) AS lvl,
         COALESCE(pp.total_quests_completed, 0) AS quests
    INTO player_level, quest_count
    FROM public.profiles p
    LEFT JOIN public.player_progress pp ON pp.user_id = p.id
   WHERE p.id = _user_id;

  IF NOT FOUND THEN
    player_level := 1; quest_count := 0;
  END IF;

  FOR a IN
    SELECT * FROM public.achievements WHERE active = true
  LOOP
    target_val := GREATEST(1, a.goal_target);
    progress_val := 0;

    IF a.unlock_type = 'level_reached' THEN
      target_val := GREATEST(1, COALESCE(NULLIF((a.unlock_requirement->>'level'),'')::int, a.goal_target, 1));
      progress_val := LEAST(target_val, player_level);
    ELSIF a.unlock_type = 'quests_completed' THEN
      target_val := GREATEST(1, COALESCE(NULLIF((a.unlock_requirement->>'count'),'')::int, a.goal_target, 1));
      progress_val := LEAST(target_val, quest_count);
    ELSIF a.unlock_type = 'specific_quest' THEN
      target_val := 1;
      SELECT COUNT(*) INTO progress_val
        FROM public.quest_sessions qs
        JOIN public.quests q ON q.id = qs.quest_id
       WHERE qs.user_id = _user_id
         AND qs.status = 'completed'
         AND q.slug = a.unlock_requirement->>'quest_slug';
      progress_val := LEAST(1, progress_val);
    ELSIF a.unlock_type = 'title_earned' THEN
      target_val := 1;
      SELECT COUNT(*) INTO progress_val
        FROM public.player_titles pt
        JOIN public.titles t ON t.id = pt.title_id
       WHERE pt.user_id = _user_id
         AND t.slug = a.unlock_requirement->>'title_slug';
      progress_val := LEAST(1, progress_val);
    ELSIF a.unlock_type = 'pioneer' THEN
      target_val := 1;
      SELECT COUNT(*) INTO progress_val
        FROM public.profiles
       WHERE id = _user_id AND is_pioneer = true;
      progress_val := LEAST(1, progress_val);
    ELSIF a.unlock_type = 'founder' THEN
      target_val := 1;
      progress_val := CASE WHEN public.has_role(_user_id, 'founder') THEN 1 ELSE 0 END;
    ELSE
      -- manual / unsupported types are only granted via assignment
      CONTINUE;
    END IF;

    -- Upsert current progress; keep target current.
    SELECT completed INTO already_completed
      FROM public.player_achievements
     WHERE user_id = _user_id AND achievement_id = a.id;

    is_now_complete := progress_val >= target_val;

    INSERT INTO public.player_achievements (user_id, achievement_id, progress, target, completed, completed_at, source)
    VALUES (_user_id, a.id, progress_val, target_val, is_now_complete,
            CASE WHEN is_now_complete THEN now() END, 'auto')
    ON CONFLICT (user_id, achievement_id) DO UPDATE
    SET progress = EXCLUDED.progress,
        target = EXCLUDED.target,
        -- Never revoke a completion once granted.
        completed = public.player_achievements.completed OR EXCLUDED.completed,
        completed_at = COALESCE(public.player_achievements.completed_at, EXCLUDED.completed_at);

    IF is_now_complete AND (already_completed IS NULL OR already_completed = false) THEN
      RETURN NEXT jsonb_build_object(
        'id', a.id,
        'slug', a.slug,
        'name', a.name,
        'description', a.description,
        'icon', a.icon,
        'color', a.color,
        'rarity', a.rarity,
        'category', a.category,
        'badge_image_url', a.badge_image_url,
        'xp_bonus', a.xp_bonus
      );
    END IF;
  END LOOP;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.evaluate_achievements_for_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_achievements_for_user(uuid) TO authenticated, service_role;

-- Founder-only manual assignment (bypasses the engine).
CREATE OR REPLACE FUNCTION public.founder_assign_achievement(_user_id UUID, _achievement_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a RECORD;
BEGIN
  IF NOT public.is_founder() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO a FROM public.achievements WHERE id = _achievement_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown achievement'; END IF;

  INSERT INTO public.player_achievements (user_id, achievement_id, progress, target, completed, completed_at, source)
  VALUES (_user_id, _achievement_id, GREATEST(1, a.goal_target), GREATEST(1, a.goal_target), true, now(), 'founder')
  ON CONFLICT (user_id, achievement_id) DO UPDATE
  SET completed = true,
      completed_at = COALESCE(public.player_achievements.completed_at, now()),
      progress = GREATEST(public.player_achievements.progress, EXCLUDED.progress),
      source = 'founder';

  RETURN jsonb_build_object('ok', true, 'slug', a.slug);
END; $$;

REVOKE ALL ON FUNCTION public.founder_assign_achievement(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.founder_assign_achievement(uuid, uuid) TO authenticated, service_role;

-- =============== SEED ===============
INSERT INTO public.achievements (slug, name, description, icon, color, category, difficulty, rarity, unlock_type, unlock_requirement, goal_target, display_order)
VALUES
  ('first-steps', 'First Steps', 'Complete your very first SideQuest.', '👣', '#a3e635', 'quest_completion', 'easy', 'common', 'quests_completed', '{"count":1}'::jsonb, 1, 10),
  ('quest-novice', 'Quest Novice', 'Complete 5 quests around town.', '🧭', '#22d3ee', 'quest_completion', 'easy', 'uncommon', 'quests_completed', '{"count":5}'::jsonb, 5, 20),
  ('quest-veteran', 'Quest Veteran', 'Complete 25 quests. Real dedication.', '🎯', '#8b5cf6', 'quest_completion', 'medium', 'rare', 'quests_completed', '{"count":25}'::jsonb, 25, 30),
  ('quest-master', 'Quest Master', 'Complete 100 quests.', '🏆', '#f59e0b', 'quest_completion', 'hard', 'epic', 'quests_completed', '{"count":100}'::jsonb, 100, 40),
  ('explorer-l5', 'Rising Explorer', 'Reach Level 5.', '⭐', '#a3e635', 'level_progression', 'easy', 'common', 'level_reached', '{"level":5}'::jsonb, 5, 110),
  ('explorer-l10', 'Seasoned Explorer', 'Reach Level 10.', '🌟', '#22d3ee', 'level_progression', 'easy', 'uncommon', 'level_reached', '{"level":10}'::jsonb, 10, 120),
  ('explorer-l25', 'Elite Explorer', 'Reach Level 25.', '💫', '#8b5cf6', 'level_progression', 'medium', 'rare', 'level_reached', '{"level":25}'::jsonb, 25, 130),
  ('pathfinder-l50', 'Pathfinder', 'Reach Level 50. Few make it here.', '🗺️', '#f59e0b', 'level_progression', 'hard', 'epic', 'level_reached', '{"level":50}'::jsonb, 50, 140),
  ('legend-l100', 'Legend of Ankleshwar', 'Reach Level 100.', '👑', '#f43f5e', 'level_progression', 'expert', 'legendary', 'level_reached', '{"level":100}'::jsonb, 100, 150),
  ('pioneer-badge', 'Founding Pioneer', 'One of the first 25 explorers of SideQuest.', '🚀', '#f59e0b', 'community', 'medium', 'legendary', 'pioneer', '{}'::jsonb, 1, 200),
  ('founder-badge', 'Founder', 'The founder of SideQuest.', '💎', '#e879f9', 'founder', 'expert', 'mythic', 'founder', '{}'::jsonb, 1, 210);

-- A secret achievement — hidden until unlocked.
INSERT INTO public.achievements (slug, name, description, icon, color, category, difficulty, rarity, unlock_type, unlock_requirement, goal_target, hidden, secret, display_order)
VALUES
  ('hidden-spark', 'Hidden Spark', 'You crossed a mysterious threshold. Reach Level 3 and reveal this secret.', '🔮', '#22d3ee', 'secret', 'easy', 'rare', 'level_reached', '{"level":3}'::jsonb, 3, true, true, 999);