ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS repeatable boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS xp_events_user_quest_reason_idx
  ON public.xp_events (user_id, quest_id, reason);

CREATE OR REPLACE FUNCTION public.award_quest_completion_xp(_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- The session owner may award their own completion; founders may award it on
  -- a player's behalf when approving a manual (photo) review.
  IF s.user_id <> auth.uid() AND NOT public.is_founder() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF s.status <> 'completed' THEN RAISE EXCEPTION 'Session not completed'; END IF;

  SELECT id, reward_xp, repeatable INTO q FROM public.quests WHERE id = s.quest_id;
  xp_amt := GREATEST(0, COALESCE(q.reward_xp, 0));

  -- Idempotency: always per session, and additionally per quest unless the
  -- quest is explicitly marked repeatable. This stops XP farming by starting
  -- a fresh session on an already-completed quest.
  SELECT id INTO existing_event FROM public.xp_events
    WHERE reason = 'quest_completed'
      AND (
        session_id = _session_id
        OR (COALESCE(q.repeatable,false) = false
            AND user_id = s.user_id
            AND quest_id = s.quest_id)
      )
    LIMIT 1;

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

  UPDATE public.profiles SET xp = new_lifetime, level = new_level WHERE id = s.user_id;

  INSERT INTO public.xp_events (user_id, quest_id, session_id, xp_earned, reason)
    VALUES (s.user_id, s.quest_id, _session_id, xp_amt, 'quest_completed');

  PERFORM public.progress_challenges_for_user(
    s.user_id,
    jsonb_build_object('quests_completed', 1, 'xp_earned', xp_amt)
  );
  PERFORM public.progress_events_for_user(s.user_id, 1);

  PERFORM public.notify_user(s.user_id, 'quest_completed', 'Quest complete',
    'You finished a quest and earned ' || xp_amt || ' XP.',
    NULL, '/quests', 15, jsonb_build_object('quest_id', s.quest_id, 'xp', xp_amt));

  IF new_level > old_level THEN
    PERFORM public.notify_user(s.user_id, 'level_up', 'Level up! Level ' || new_level,
      'You reached a new level.', NULL, '/profile', 25,
      jsonb_build_object('level', new_level));
  END IF;

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
$function$;