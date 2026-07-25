
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.event_type AS ENUM (
    'daily_quest_set','weekly_challenge','monthly_challenge','seasonal','holiday',
    'limited_time','founder','community','beta','sponsored'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM ('draft','scheduled','live','ended','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.event_visibility AS ENUM ('public','unlisted','private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.challenge_metric AS ENUM (
    'quests_completed','xp_earned','locations_visited','qr_scans','photos_submitted',
    'collections_completed','achievements_unlocked','level_reached','trivia_correct'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.challenge_reset AS ENUM ('none','daily','weekly','monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reward_kind AS ENUM ('xp','title','achievement','collection','badge_image');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_kind AS ENUM (
    'quest_completed','xp_earned','level_up','achievement_unlocked','title_unlocked',
    'collection_completed','event_started','event_ending','event_reward','challenge_reward',
    'daily_reset','weekly_reset','monthly_reset','announcement','leaderboard','system'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.announcement_priority AS ENUM ('info','normal','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ EVENTS ============
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  banner_url text,
  cover_url text,
  icon text NOT NULL DEFAULT '🎉',
  event_type public.event_type NOT NULL,
  status public.event_status NOT NULL DEFAULT 'draft',
  visibility public.event_visibility NOT NULL DEFAULT 'public',
  featured boolean NOT NULL DEFAULT false,
  priority int NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  max_participants int,
  repeatable boolean NOT NULL DEFAULT false,
  community_goal int NOT NULL DEFAULT 0,
  community_progress int NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public live/scheduled events" ON public.events
  FOR SELECT USING (visibility = 'public' AND status IN ('scheduled','live','ended'));
CREATE POLICY "Authenticated can view public events" ON public.events
  FOR SELECT TO authenticated USING (visibility = 'public');
CREATE POLICY "Founders can view all events" ON public.events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'founder'));
CREATE POLICY "Founders manage events" ON public.events
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'founder'));

-- ============ EVENT REWARDS ============
CREATE TABLE IF NOT EXISTS public.event_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  kind public.reward_kind NOT NULL,
  xp_amount int NOT NULL DEFAULT 0,
  title_id uuid REFERENCES public.titles(id) ON DELETE SET NULL,
  achievement_id uuid REFERENCES public.achievements(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  badge_image_url text,
  label text NOT NULL DEFAULT '',
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_rewards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_rewards TO authenticated;
GRANT ALL ON public.event_rewards TO service_role;
ALTER TABLE public.event_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rewards for visible events" ON public.event_rewards
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.visibility = 'public'));
CREATE POLICY "Founders manage event rewards" ON public.event_rewards
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'founder'));

-- ============ EVENT QUESTS ============
CREATE TABLE IF NOT EXISTS public.event_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  display_order int NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, quest_id)
);
GRANT SELECT ON public.event_quests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_quests TO authenticated;
GRANT ALL ON public.event_quests TO service_role;
ALTER TABLE public.event_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event quests" ON public.event_quests FOR SELECT USING (true);
CREATE POLICY "Founders manage event quests" ON public.event_quests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'founder'));

-- ============ CHALLENGES ============
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '🎯',
  metric public.challenge_metric NOT NULL,
  target int NOT NULL CHECK (target > 0),
  reset_frequency public.challenge_reset NOT NULL DEFAULT 'daily',
  reward_xp int NOT NULL DEFAULT 0,
  reward_title_id uuid REFERENCES public.titles(id) ON DELETE SET NULL,
  reward_achievement_id uuid REFERENCES public.achievements(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  visibility public.event_visibility NOT NULL DEFAULT 'public',
  display_order int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public active challenges" ON public.challenges
  FOR SELECT USING (visibility = 'public' AND active = true);
CREATE POLICY "Authenticated can view active challenges" ON public.challenges
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Founders manage challenges" ON public.challenges
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'founder'));

CREATE TABLE IF NOT EXISTS public.event_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  display_order int NOT NULL DEFAULT 0,
  UNIQUE (event_id, challenge_id)
);
GRANT SELECT ON public.event_challenges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_challenges TO authenticated;
GRANT ALL ON public.event_challenges TO service_role;
ALTER TABLE public.event_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event_challenges" ON public.event_challenges FOR SELECT USING (true);
CREATE POLICY "Founders manage event_challenges" ON public.event_challenges
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'founder'));

-- ============ PLAYER EVENTS ============
CREATE TABLE IF NOT EXISTS public.player_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  joined boolean NOT NULL DEFAULT true,
  progress int NOT NULL DEFAULT 0,
  target int NOT NULL DEFAULT 0,
  percent int NOT NULL DEFAULT 0,
  contribution int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  reward_granted boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_events TO authenticated;
GRANT ALL ON public.player_events TO service_role;
ALTER TABLE public.player_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own player_events" ON public.player_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "Users insert own player_events" ON public.player_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own player_events" ON public.player_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ PLAYER CHALLENGES ============
CREATE TABLE IF NOT EXISTS public.player_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  progress int NOT NULL DEFAULT 0,
  target int NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  reward_granted boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id, period_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_challenges TO authenticated;
GRANT ALL ON public.player_challenges TO service_role;
ALTER TABLE public.player_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own player_challenges" ON public.player_challenges
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'founder'));

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.notification_kind NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  icon text,
  deep_link text,
  priority int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON public.notifications (user_id) WHERE read_at IS NULL;

-- ============ ANNOUNCEMENTS ============
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  banner_url text,
  icon text NOT NULL DEFAULT '📣',
  priority public.announcement_priority NOT NULL DEFAULT 'normal',
  visibility public.event_visibility NOT NULL DEFAULT 'public',
  deep_link text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active announcements" ON public.announcements
  FOR SELECT USING (visibility = 'public' AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "Founders manage announcements" ON public.announcements
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'founder'));

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, announcement_id)
);
GRANT SELECT, INSERT, DELETE ON public.announcement_reads TO authenticated;
GRANT ALL ON public.announcement_reads TO service_role;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own announcement_reads" ON public.announcement_reads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users mark announcement read" ON public.announcement_reads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete announcement_read" ON public.announcement_reads
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ FEATURED QUESTS ============
CREATE TABLE IF NOT EXISTS public.featured_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  priority int NOT NULL DEFAULT 0,
  boost boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.featured_quests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.featured_quests TO authenticated;
GRANT ALL ON public.featured_quests TO service_role;
ALTER TABLE public.featured_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active featured quests" ON public.featured_quests
  FOR SELECT USING (starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "Founders manage featured quests" ON public.featured_quests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'founder'));

-- ============ TRIGGERS: updated_at ============
CREATE OR REPLACE FUNCTION public.tg_liveops_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.tg_liveops_updated_at();

DROP TRIGGER IF EXISTS trg_challenges_updated_at ON public.challenges;
CREATE TRIGGER trg_challenges_updated_at BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.tg_liveops_updated_at();

DROP TRIGGER IF EXISTS trg_player_events_updated_at ON public.player_events;
CREATE TRIGGER trg_player_events_updated_at BEFORE UPDATE ON public.player_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_liveops_updated_at();

DROP TRIGGER IF EXISTS trg_player_challenges_updated_at ON public.player_challenges;
CREATE TRIGGER trg_player_challenges_updated_at BEFORE UPDATE ON public.player_challenges
  FOR EACH ROW EXECUTE FUNCTION public.tg_liveops_updated_at();

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.tg_liveops_updated_at();

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.notify_user(
  _user_id uuid, _kind public.notification_kind, _title text, _body text,
  _icon text DEFAULT NULL, _deep_link text DEFAULT NULL, _priority int DEFAULT 0,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, icon, deep_link, priority, metadata)
  VALUES (_user_id, _kind, _title, COALESCE(_body,''), _icon, _deep_link, COALESCE(_priority,0), COALESCE(_metadata,'{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.current_period_start(_freq public.challenge_reset)
RETURNS timestamptz LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _freq
    WHEN 'daily'   THEN date_trunc('day',   (now() AT TIME ZONE 'UTC')) AT TIME ZONE 'UTC'
    WHEN 'weekly'  THEN date_trunc('week',  (now() AT TIME ZONE 'UTC')) AT TIME ZONE 'UTC'
    WHEN 'monthly' THEN date_trunc('month', (now() AT TIME ZONE 'UTC')) AT TIME ZONE 'UTC'
    ELSE 'epoch'::timestamptz
  END;
$$;

-- Grant challenge reward once
CREATE OR REPLACE FUNCTION public._grant_challenge_reward(_pc_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pc RECORD; ch RECORD; new_lifetime int; new_level int; old_level int;
  cur_thr int; next_thr int;
BEGIN
  SELECT * INTO pc FROM public.player_challenges WHERE id = _pc_id FOR UPDATE;
  IF NOT FOUND OR pc.reward_granted THEN RETURN; END IF;
  SELECT * INTO ch FROM public.challenges WHERE id = pc.challenge_id;

  IF COALESCE(ch.reward_xp,0) > 0 THEN
    INSERT INTO public.player_progress (user_id) VALUES (pc.user_id) ON CONFLICT (user_id) DO NOTHING;
    SELECT current_level, lifetime_xp INTO old_level, new_lifetime
      FROM public.player_progress WHERE user_id = pc.user_id FOR UPDATE;
    new_lifetime := COALESCE(new_lifetime,0) + ch.reward_xp;
    new_level := public.level_from_total_xp(new_lifetime);
    cur_thr := public.xp_required_for_level(new_level);
    next_thr := public.xp_required_for_level(new_level + 1);
    UPDATE public.player_progress SET
      lifetime_xp = new_lifetime, current_level = new_level,
      current_level_xp = new_lifetime - cur_thr,
      xp_for_next_level = GREATEST(1, next_thr - cur_thr),
      level_up_date = CASE WHEN new_level > COALESCE(old_level,1) THEN now() ELSE level_up_date END
    WHERE user_id = pc.user_id;
    UPDATE public.profiles SET xp = new_lifetime, level = new_level WHERE id = pc.user_id;
    INSERT INTO public.xp_events (user_id, xp_earned, reason, metadata)
      VALUES (pc.user_id, ch.reward_xp, 'challenge_completed',
              jsonb_build_object('challenge_id', ch.id, 'challenge_slug', ch.slug));
  END IF;

  IF ch.reward_title_id IS NOT NULL THEN
    PERFORM public._grant_title(pc.user_id, ch.reward_title_id, 'system'::title_source);
  END IF;

  IF ch.reward_achievement_id IS NOT NULL THEN
    INSERT INTO public.player_achievements (user_id, achievement_id, progress, target, completed, completed_at, source)
    VALUES (pc.user_id, ch.reward_achievement_id, 1, 1, true, now(), 'system')
    ON CONFLICT (user_id, achievement_id) DO UPDATE
      SET completed = true, completed_at = COALESCE(public.player_achievements.completed_at, now());
  END IF;

  UPDATE public.player_challenges SET reward_granted = true WHERE id = _pc_id;

  PERFORM public.notify_user(
    pc.user_id, 'challenge_reward',
    COALESCE(ch.name,'Challenge complete'),
    'You completed a challenge and earned rewards.',
    ch.icon, '/challenges', 20,
    jsonb_build_object('challenge_id', ch.id, 'reward_xp', ch.reward_xp)
  );
END; $$;

-- Progress all matching challenges for a user
CREATE OR REPLACE FUNCTION public.progress_challenges_for_user(_user_id uuid, _delta jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ch RECORD; pc_id uuid; period timestamptz; add_val int; cur_progress int;
  new_progress int; was_completed boolean;
BEGIN
  IF _user_id IS NULL OR _delta IS NULL THEN RETURN; END IF;

  FOR ch IN SELECT * FROM public.challenges WHERE active = true LOOP
    add_val := COALESCE((_delta->>(ch.metric::text))::int, 0);
    IF add_val <= 0 THEN CONTINUE; END IF;

    period := public.current_period_start(ch.reset_frequency);

    INSERT INTO public.player_challenges (user_id, challenge_id, period_start, progress, target)
    VALUES (_user_id, ch.id, period, 0, ch.target)
    ON CONFLICT (user_id, challenge_id, period_start) DO NOTHING;

    SELECT id, progress, completed INTO pc_id, cur_progress, was_completed
      FROM public.player_challenges
     WHERE user_id = _user_id AND challenge_id = ch.id AND period_start = period
     FOR UPDATE;

    IF was_completed THEN CONTINUE; END IF;

    new_progress := LEAST(ch.target, COALESCE(cur_progress,0) + add_val);
    UPDATE public.player_challenges
       SET progress = new_progress,
           completed = new_progress >= ch.target,
           completed_at = CASE WHEN new_progress >= ch.target THEN now() ELSE completed_at END
     WHERE id = pc_id;

    IF new_progress >= ch.target THEN
      PERFORM public._grant_challenge_reward(pc_id);
    END IF;
  END LOOP;
END; $$;

-- Progress community goal for events the user has joined that are live
CREATE OR REPLACE FUNCTION public.progress_events_for_user(_user_id uuid, _delta int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ev RECORD; pe RECORD;
BEGIN
  IF _user_id IS NULL OR _delta IS NULL OR _delta <= 0 THEN RETURN; END IF;
  FOR ev IN
    SELECT e.* FROM public.events e
     WHERE e.status = 'live' AND e.event_type = 'community'
       AND e.starts_at <= now() AND (e.ends_at IS NULL OR e.ends_at > now())
  LOOP
    SELECT * INTO pe FROM public.player_events WHERE user_id = _user_id AND event_id = ev.id;
    IF NOT FOUND THEN CONTINUE; END IF;

    UPDATE public.player_events
       SET contribution = contribution + _delta,
           progress = progress + _delta
     WHERE id = pe.id;

    UPDATE public.events
       SET community_progress = community_progress + _delta
     WHERE id = ev.id;
  END LOOP;
END; $$;

-- Grant event rewards once when a player completes a joined event
CREATE OR REPLACE FUNCTION public._grant_event_rewards(_user_id uuid, _event_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pe RECORD; r RECORD; ev RECORD; new_lifetime int; new_level int; old_level int;
  cur_thr int; next_thr int;
BEGIN
  SELECT * INTO pe FROM public.player_events WHERE user_id = _user_id AND event_id = _event_id FOR UPDATE;
  IF NOT FOUND OR pe.reward_granted THEN RETURN; END IF;
  SELECT * INTO ev FROM public.events WHERE id = _event_id;

  FOR r IN SELECT * FROM public.event_rewards WHERE event_id = _event_id ORDER BY display_order LOOP
    IF r.kind = 'xp' AND COALESCE(r.xp_amount,0) > 0 THEN
      INSERT INTO public.player_progress (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
      SELECT current_level, lifetime_xp INTO old_level, new_lifetime
        FROM public.player_progress WHERE user_id = _user_id FOR UPDATE;
      new_lifetime := COALESCE(new_lifetime,0) + r.xp_amount;
      new_level := public.level_from_total_xp(new_lifetime);
      cur_thr := public.xp_required_for_level(new_level);
      next_thr := public.xp_required_for_level(new_level + 1);
      UPDATE public.player_progress SET
        lifetime_xp = new_lifetime, current_level = new_level,
        current_level_xp = new_lifetime - cur_thr,
        xp_for_next_level = GREATEST(1, next_thr - cur_thr),
        level_up_date = CASE WHEN new_level > COALESCE(old_level,1) THEN now() ELSE level_up_date END
      WHERE user_id = _user_id;
      UPDATE public.profiles SET xp = new_lifetime, level = new_level WHERE id = _user_id;
      INSERT INTO public.xp_events (user_id, xp_earned, reason, metadata)
        VALUES (_user_id, r.xp_amount, 'event_completed', jsonb_build_object('event_id', ev.id, 'event_slug', ev.slug));
    ELSIF r.kind = 'title' AND r.title_id IS NOT NULL THEN
      PERFORM public._grant_title(_user_id, r.title_id, 'event'::title_source);
    ELSIF r.kind = 'achievement' AND r.achievement_id IS NOT NULL THEN
      INSERT INTO public.player_achievements (user_id, achievement_id, progress, target, completed, completed_at, source)
      VALUES (_user_id, r.achievement_id, 1, 1, true, now(), 'event')
      ON CONFLICT (user_id, achievement_id) DO UPDATE
        SET completed = true, completed_at = COALESCE(public.player_achievements.completed_at, now());
    END IF;
  END LOOP;

  UPDATE public.player_events SET reward_granted = true, completed = true,
    completed_at = COALESCE(completed_at, now()) WHERE id = pe.id;

  PERFORM public.notify_user(_user_id, 'event_reward', ev.name || ' rewards granted',
    'Congratulations! You earned event rewards.', ev.icon,
    '/events/' || ev.slug, 30, jsonb_build_object('event_id', ev.id));
END; $$;

-- Publish/end scheduled events + notify participants
CREATE OR REPLACE FUNCTION public.tick_liveops()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE published int := 0; ended int := 0; ev RECORD; pe RECORD;
BEGIN
  -- draft/scheduled -> live
  FOR ev IN
    SELECT * FROM public.events
     WHERE status IN ('scheduled','draft')
       AND starts_at <= now()
       AND (ends_at IS NULL OR ends_at > now())
       AND visibility <> 'private'
  LOOP
    UPDATE public.events SET status = 'live', published_at = COALESCE(published_at, now())
      WHERE id = ev.id;
    published := published + 1;
  END LOOP;

  -- live -> ended
  FOR ev IN
    SELECT * FROM public.events
     WHERE status = 'live' AND ends_at IS NOT NULL AND ends_at <= now()
  LOOP
    UPDATE public.events SET status = 'ended' WHERE id = ev.id;
    ended := ended + 1;

    -- grant rewards to completed community participants
    IF ev.event_type = 'community' AND ev.community_goal > 0
       AND ev.community_progress >= ev.community_goal THEN
      FOR pe IN SELECT * FROM public.player_events WHERE event_id = ev.id AND reward_granted = false LOOP
        PERFORM public._grant_event_rewards(pe.user_id, ev.id);
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('published', published, 'ended', ended);
END; $$;

-- Player joins an event
CREATE OR REPLACE FUNCTION public.join_event(_event_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); ev RECORD; cnt int; tgt int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO ev FROM public.events WHERE id = _event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
  IF ev.status NOT IN ('live','scheduled') THEN RAISE EXCEPTION 'Event not open'; END IF;
  IF ev.max_participants IS NOT NULL THEN
    SELECT count(*) INTO cnt FROM public.player_events WHERE event_id = _event_id;
    IF cnt >= ev.max_participants THEN RAISE EXCEPTION 'Event is full'; END IF;
  END IF;
  tgt := CASE WHEN ev.event_type = 'community' THEN ev.community_goal ELSE 1 END;
  INSERT INTO public.player_events (user_id, event_id, target, progress)
  VALUES (_uid, _event_id, tgt, 0)
  ON CONFLICT (user_id, event_id) DO UPDATE SET joined = true;
  PERFORM public.notify_user(_uid, 'event_started', 'Joined ' || ev.name,
    'You joined a SideQuest event.', ev.icon, '/events/' || ev.slug, 10,
    jsonb_build_object('event_id', ev.id));
  RETURN jsonb_build_object('ok', true, 'event_id', _event_id);
END; $$;

-- ============ Hook into existing quest completion ============
-- Wrap award_quest_completion_xp to also progress challenges + events.
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
  IF s.user_id <> auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF s.status <> 'completed' THEN RAISE EXCEPTION 'Session not completed'; END IF;

  SELECT id, reward_xp INTO q FROM public.quests WHERE id = s.quest_id;
  xp_amt := GREATEST(0, COALESCE(q.reward_xp, 0));

  SELECT id INTO existing_event FROM public.xp_events
    WHERE session_id = _session_id AND reason = 'quest_completed' LIMIT 1;

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

  -- LiveOps: progress challenges + community events for this player
  PERFORM public.progress_challenges_for_user(
    s.user_id,
    jsonb_build_object('quests_completed', 1, 'xp_earned', xp_amt)
  );
  PERFORM public.progress_events_for_user(s.user_id, 1);

  -- Notify
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
