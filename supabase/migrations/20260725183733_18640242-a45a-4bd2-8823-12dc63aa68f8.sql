
-- ================== player_progress ==================
CREATE TABLE public.player_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level int NOT NULL DEFAULT 1,
  lifetime_xp int NOT NULL DEFAULT 0,
  current_level_xp int NOT NULL DEFAULT 0,
  xp_for_next_level int NOT NULL DEFAULT 100,
  total_quests_completed int NOT NULL DEFAULT 0,
  level_up_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.player_progress TO authenticated;
GRANT ALL ON public.player_progress TO service_role;

ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players view own progress" ON public.player_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_founder());

CREATE TRIGGER tg_player_progress_updated_at
  BEFORE UPDATE ON public.player_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();

-- ================== xp_events ==================
CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id uuid REFERENCES public.quests(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.quest_sessions(id) ON DELETE SET NULL,
  xp_earned int NOT NULL,
  reason text NOT NULL DEFAULT 'quest_completed',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT xp_events_xp_nonneg CHECK (xp_earned >= 0)
);

CREATE INDEX xp_events_user_created_idx ON public.xp_events (user_id, created_at DESC);
CREATE UNIQUE INDEX xp_events_unique_quest_completion
  ON public.xp_events (session_id) WHERE reason = 'quest_completed';

GRANT SELECT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players view own xp events" ON public.xp_events
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_founder());

-- ================== Level formulas ==================
CREATE OR REPLACE FUNCTION public.xp_required_for_level(_level int)
RETURNS int LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _level <= 1 THEN 0
    ELSE (100 * power(_level - 1, 1.6))::int
  END;
$$;

CREATE OR REPLACE FUNCTION public.level_from_total_xp(_xp int)
RETURNS int LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT MAX(l)::int FROM generate_series(1, 200) l
       WHERE public.xp_required_for_level(l) <= COALESCE(_xp, 0)),
    1
  );
$$;

GRANT EXECUTE ON FUNCTION public.xp_required_for_level(int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.level_from_total_xp(int) TO anon, authenticated;

-- ================== Award XP for quest completion ==================
CREATE OR REPLACE FUNCTION public.award_quest_completion_xp(_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s record;
  q record;
  existing_event uuid;
  xp_amt int;
  prog record;
  old_level int;
  new_level int;
  new_lifetime int;
  cur_thr int;
  next_thr int;
BEGIN
  SELECT id, user_id, quest_id, status INTO s FROM public.quest_sessions WHERE id = _session_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session not found'; END IF;
  IF s.user_id <> auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF s.status <> 'completed' THEN RAISE EXCEPTION 'Session not completed'; END IF;

  SELECT id, reward_xp INTO q FROM public.quests WHERE id = s.quest_id;
  xp_amt := GREATEST(0, COALESCE(q.reward_xp, 0));

  -- Idempotency: has this session already been rewarded?
  SELECT id INTO existing_event FROM public.xp_events
    WHERE session_id = _session_id AND reason = 'quest_completed' LIMIT 1;

  -- Ensure progress row
  INSERT INTO public.player_progress (user_id) VALUES (s.user_id)
    ON CONFLICT (user_id) DO NOTHING;

  IF existing_event IS NOT NULL THEN
    SELECT * INTO prog FROM public.player_progress WHERE user_id = s.user_id;
    cur_thr := public.xp_required_for_level(prog.current_level);
    next_thr := public.xp_required_for_level(prog.current_level + 1);
    RETURN jsonb_build_object(
      'xp_earned', 0, 'already_awarded', true,
      'old_level', prog.current_level, 'new_level', prog.current_level,
      'level_up', false, 'lifetime_xp', prog.lifetime_xp,
      'current_level_xp', prog.lifetime_xp - cur_thr,
      'xp_for_next', GREATEST(1, next_thr - cur_thr)
    );
  END IF;

  SELECT * INTO prog FROM public.player_progress WHERE user_id = s.user_id FOR UPDATE;
  old_level := prog.current_level;
  new_lifetime := prog.lifetime_xp + xp_amt;
  new_level := public.level_from_total_xp(new_lifetime);
  cur_thr := public.xp_required_for_level(new_level);
  next_thr := public.xp_required_for_level(new_level + 1);

  UPDATE public.player_progress SET
    lifetime_xp = new_lifetime,
    current_level = new_level,
    current_level_xp = new_lifetime - cur_thr,
    xp_for_next_level = GREATEST(1, next_thr - cur_thr),
    total_quests_completed = total_quests_completed + 1,
    level_up_date = CASE WHEN new_level > old_level THEN now() ELSE level_up_date END
  WHERE user_id = s.user_id;

  UPDATE public.profiles SET
    xp = new_lifetime,
    level = new_level
  WHERE id = s.user_id;

  INSERT INTO public.xp_events (user_id, quest_id, session_id, xp_earned, reason)
    VALUES (s.user_id, s.quest_id, _session_id, xp_amt, 'quest_completed');

  RETURN jsonb_build_object(
    'xp_earned', xp_amt,
    'old_level', old_level,
    'new_level', new_level,
    'level_up', new_level > old_level,
    'lifetime_xp', new_lifetime,
    'current_level_xp', new_lifetime - cur_thr,
    'xp_for_next', GREATEST(1, next_thr - cur_thr),
    'already_awarded', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_quest_completion_xp(uuid) TO authenticated;

-- Backfill: create empty progress rows for existing profiles so queries work
INSERT INTO public.player_progress (user_id, lifetime_xp, current_level)
SELECT id, COALESCE(xp, 0), COALESCE(level, 1) FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
