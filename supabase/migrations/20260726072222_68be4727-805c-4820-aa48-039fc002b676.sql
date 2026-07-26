
-- ============ profiles: soft-suspension fields ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

-- ============ helper: assert founder ============
CREATE OR REPLACE FUNCTION public._assert_founder()
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_founder() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
END;$$;

-- ============ suspend / restore ============
CREATE OR REPLACE FUNCTION public.admin_suspend_player(_user_id uuid, _reason text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text;
BEGIN
  PERFORM public._assert_founder();
  UPDATE public.profiles
     SET suspended_at = now(), suspended_reason = COALESCE(_reason, suspended_reason)
   WHERE id = _user_id;
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  PERFORM public.record_audit('player.suspend','player',_user_id,
    COALESCE(_email,'unknown') || ' suspended',
    '{}'::jsonb, jsonb_build_object('reason',_reason), '{}'::jsonb);
  RETURN true;
END;$$;

CREATE OR REPLACE FUNCTION public.admin_restore_player(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_founder();
  UPDATE public.profiles SET suspended_at = NULL, suspended_reason = NULL WHERE id = _user_id;
  PERFORM public.record_audit('player.restore','player',_user_id,'Player restored',
    '{}'::jsonb,'{}'::jsonb,'{}'::jsonb);
  RETURN true;
END;$$;

-- ============ profile visibility ============
CREATE OR REPLACE FUNCTION public.admin_set_profile_hidden(_user_id uuid, _hidden boolean)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_founder();
  INSERT INTO public.player_social_settings (user_id, moderation_hidden)
    VALUES (_user_id, COALESCE(_hidden,false))
    ON CONFLICT (user_id) DO UPDATE SET moderation_hidden = EXCLUDED.moderation_hidden,
      updated_at = now();
  PERFORM public.record_audit(
    CASE WHEN _hidden THEN 'player.hide' ELSE 'player.unhide' END,
    'player',_user_id,
    CASE WHEN _hidden THEN 'Profile hidden' ELSE 'Profile unhidden' END,
    '{}'::jsonb,'{}'::jsonb,'{}'::jsonb);
  RETURN true;
END;$$;

-- ============ XP grant / remove ============
CREATE OR REPLACE FUNCTION public.admin_adjust_xp(_user_id uuid, _delta int, _reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_lifetime int; new_level int; old_level int; cur_thr int; next_thr int;
BEGIN
  PERFORM public._assert_founder();
  IF _delta IS NULL OR _delta = 0 THEN RAISE EXCEPTION 'delta required'; END IF;

  INSERT INTO public.player_progress (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT current_level, lifetime_xp INTO old_level, new_lifetime
    FROM public.player_progress WHERE user_id = _user_id FOR UPDATE;
  new_lifetime := GREATEST(0, COALESCE(new_lifetime,0) + _delta);
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
    VALUES (_user_id, _delta,
      CASE WHEN _delta > 0 THEN 'admin_grant' ELSE 'admin_remove' END,
      jsonb_build_object('reason', COALESCE(_reason,''), 'admin', auth.uid()));

  PERFORM public.record_audit(
    CASE WHEN _delta > 0 THEN 'player.grant_xp' ELSE 'player.remove_xp' END,
    'player',_user_id,
    (CASE WHEN _delta>0 THEN '+' ELSE '' END) || _delta || ' XP',
    '{}'::jsonb,
    jsonb_build_object('delta',_delta,'reason',_reason,'new_level',new_level,'lifetime_xp',new_lifetime),
    '{}'::jsonb);

  RETURN jsonb_build_object('ok',true,'lifetime_xp',new_lifetime,'level',new_level);
END;$$;

-- ============ Titles ============
CREATE OR REPLACE FUNCTION public.admin_grant_title(_user_id uuid, _title_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _slug text;
BEGIN
  PERFORM public._assert_founder();
  PERFORM public._grant_title(_user_id,_title_id,'founder');
  SELECT slug INTO _slug FROM public.titles WHERE id = _title_id;
  PERFORM public.record_audit('player.grant_title','player',_user_id,'Granted title '||COALESCE(_slug,''),
    '{}'::jsonb,jsonb_build_object('title_id',_title_id,'slug',_slug),'{}'::jsonb);
  RETURN true;
END;$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_title(_user_id uuid, _title_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_founder();
  DELETE FROM public.player_titles WHERE user_id = _user_id AND title_id = _title_id;
  PERFORM public.record_audit('player.revoke_title','player',_user_id,'Revoked title',
    '{}'::jsonb,jsonb_build_object('title_id',_title_id),'{}'::jsonb);
  RETURN true;
END;$$;

-- ============ Achievements ============
CREATE OR REPLACE FUNCTION public.admin_grant_achievement(_user_id uuid, _achievement_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_founder();
  PERFORM public.founder_assign_achievement(_user_id,_achievement_id);
  PERFORM public.record_audit('player.grant_achievement','player',_user_id,'Granted achievement',
    '{}'::jsonb,jsonb_build_object('achievement_id',_achievement_id),'{}'::jsonb);
  RETURN true;
END;$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_achievement(_user_id uuid, _achievement_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_founder();
  DELETE FROM public.player_achievements WHERE user_id = _user_id AND achievement_id = _achievement_id;
  PERFORM public.record_audit('player.revoke_achievement','player',_user_id,'Revoked achievement',
    '{}'::jsonb,jsonb_build_object('achievement_id',_achievement_id),'{}'::jsonb);
  RETURN true;
END;$$;

-- ============ Reset quest session ============
CREATE OR REPLACE FUNCTION public.admin_reset_quest_session(_session_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _qid uuid;
BEGIN
  PERFORM public._assert_founder();
  SELECT user_id, quest_id INTO _uid,_qid FROM public.quest_sessions WHERE id = _session_id;
  IF _uid IS NULL THEN RAISE EXCEPTION 'Session not found'; END IF;
  DELETE FROM public.objective_progress WHERE session_id = _session_id;
  DELETE FROM public.quest_sessions WHERE id = _session_id;
  PERFORM public.record_audit('player.reset_quest','quest_session',_session_id,'Reset quest session',
    '{}'::jsonb,jsonb_build_object('user_id',_uid,'quest_id',_qid),'{}'::jsonb);
  RETURN true;
END;$$;

-- ============ Reset event progress ============
CREATE OR REPLACE FUNCTION public.admin_reset_event_progress(_user_id uuid, _event_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_founder();
  UPDATE public.player_events
     SET progress = 0, percent = 0, contribution = 0,
         completed = false, completed_at = NULL, reward_granted = false,
         updated_at = now()
   WHERE user_id = _user_id AND event_id = _event_id;
  PERFORM public.record_audit('player.reset_event','player',_user_id,'Reset event progress',
    '{}'::jsonb,jsonb_build_object('event_id',_event_id),'{}'::jsonb);
  RETURN true;
END;$$;

-- ============ Admin player list (safe read) ============
CREATE OR REPLACE FUNCTION public.admin_list_players(
  _search text DEFAULT NULL,
  _city text DEFAULT NULL,
  _min_level int DEFAULT NULL,
  _only_suspended boolean DEFAULT NULL,
  _only_hidden boolean DEFAULT NULL,
  _only_pioneer boolean DEFAULT NULL,
  _only_founder boolean DEFAULT NULL,
  _limit int DEFAULT 50,
  _offset int DEFAULT 0
) RETURNS TABLE(
  id uuid, username text, display_name text, avatar_url text, city text,
  level int, xp int, is_pioneer boolean, pioneer_number int,
  suspended_at timestamptz, moderation_hidden boolean, is_founder boolean,
  quests_completed int, last_active_at timestamptz, created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_founder();
  RETURN QUERY
  SELECT p.id, p.username, p.display_name, p.avatar_url, p.city,
         p.level, p.xp, p.is_pioneer, p.pioneer_number,
         p.suspended_at,
         COALESCE(s.moderation_hidden,false),
         EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'founder'),
         COALESCE(ps.quests_completed,0),
         ps.last_active_at,
         p.created_at
    FROM public.profiles p
    LEFT JOIN public.player_social_settings s ON s.user_id = p.id
    LEFT JOIN public.player_stats ps ON ps.user_id = p.id
   WHERE (_search IS NULL OR _search = '' OR
          p.username ILIKE '%'||_search||'%' OR
          p.display_name ILIKE '%'||_search||'%')
     AND (_city IS NULL OR _city = '' OR lower(p.city) = lower(_city))
     AND (_min_level IS NULL OR p.level >= _min_level)
     AND (_only_suspended IS NOT TRUE OR p.suspended_at IS NOT NULL)
     AND (_only_hidden IS NOT TRUE OR COALESCE(s.moderation_hidden,false) = true)
     AND (_only_pioneer IS NOT TRUE OR p.is_pioneer = true)
     AND (_only_founder IS NOT TRUE OR EXISTS(
          SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'founder'))
   ORDER BY p.created_at DESC
   LIMIT COALESCE(_limit,50) OFFSET COALESCE(_offset,0);
END;$$;

-- ============ Admin player detail ============
CREATE OR REPLACE FUNCTION public.admin_get_player(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  PERFORM public._assert_founder();
  SELECT jsonb_build_object(
    'profile', to_jsonb(p) - 'created_at' - 'updated_at'
                || jsonb_build_object('created_at',p.created_at,'updated_at',p.updated_at),
    'progress', to_jsonb(pp),
    'stats', to_jsonb(ps),
    'social', to_jsonb(s),
    'is_founder', EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id=p.id AND ur.role='founder'),
    'titles', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'title_id', t.id, 'name', t.name, 'slug', t.slug, 'rarity', t.rarity,
        'equipped', pt.equipped, 'unlocked_at', pt.unlocked_at, 'source', pt.source
      ) ORDER BY pt.unlocked_at DESC)
      FROM public.player_titles pt JOIN public.titles t ON t.id = pt.title_id
      WHERE pt.user_id = p.id),'[]'::jsonb),
    'achievements', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'achievement_id', a.id, 'name', a.name, 'slug', a.slug, 'rarity', a.rarity,
        'progress', pa.progress, 'target', pa.target, 'completed', pa.completed,
        'completed_at', pa.completed_at
      ) ORDER BY pa.updated_at DESC)
      FROM public.player_achievements pa JOIN public.achievements a ON a.id = pa.achievement_id
      WHERE pa.user_id = p.id),'[]'::jsonb),
    'collections', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'collection_id', c.id, 'name', c.name, 'slug', c.slug,
        'percent', pc.percent, 'completed', pc.completed
      ) ORDER BY pc.last_progress_at DESC)
      FROM public.player_collections pc JOIN public.collections c ON c.id = pc.collection_id
      WHERE pc.user_id = p.id),'[]'::jsonb),
    'quest_sessions', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', qs.id, 'quest_id', q.id, 'title', q.title, 'slug', q.slug,
        'status', qs.status, 'started_at', qs.started_at, 'completed_at', qs.completed_at
      ) ORDER BY qs.started_at DESC)
      FROM public.quest_sessions qs JOIN public.quests q ON q.id = qs.quest_id
      WHERE qs.user_id = p.id LIMIT 100),'[]'::jsonb),
    'events', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'event_id', e.id, 'name', e.name, 'slug', e.slug,
        'progress', pe.progress, 'target', pe.target, 'percent', pe.percent,
        'completed', pe.completed, 'joined_at', pe.joined_at
      ) ORDER BY pe.joined_at DESC)
      FROM public.player_events pe JOIN public.events e ON e.id = pe.event_id
      WHERE pe.user_id = p.id),'[]'::jsonb),
    'recent_xp', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', xe.id, 'xp_earned', xe.xp_earned, 'reason', xe.reason,
        'metadata', xe.metadata, 'created_at', xe.created_at
      ) ORDER BY xe.created_at DESC)
      FROM (SELECT * FROM public.xp_events WHERE user_id = p.id
            ORDER BY created_at DESC LIMIT 50) xe),'[]'::jsonb)
  ) INTO result
  FROM public.profiles p
  LEFT JOIN public.player_progress pp ON pp.user_id = p.id
  LEFT JOIN public.player_stats ps ON ps.user_id = p.id
  LEFT JOIN public.player_social_settings s ON s.user_id = p.id
  WHERE p.id = _user_id;

  IF result IS NULL THEN RAISE EXCEPTION 'Player not found'; END IF;
  RETURN result;
END;$$;

-- ============ Grants ============
GRANT EXECUTE ON FUNCTION public._assert_founder() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_player(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restore_player(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_hidden(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_xp(uuid,int,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_title(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_title(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_achievement(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_achievement(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_quest_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_event_progress(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_players(text,text,int,boolean,boolean,boolean,boolean,int,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_player(uuid) TO authenticated;
