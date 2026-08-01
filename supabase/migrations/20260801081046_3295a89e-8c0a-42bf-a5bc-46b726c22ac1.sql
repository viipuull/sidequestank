
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  icon text NOT NULL DEFAULT '🔔',
  kind push_kind NOT NULL DEFAULT 'founder_announcement',
  priority text NOT NULL DEFAULT 'info',
  deep_link text NOT NULL DEFAULT '/home',
  action_label text,
  action_url text,
  variations text[] NOT NULL DEFAULT '{}',
  favorite boolean NOT NULL DEFAULT false,
  built_in boolean NOT NULL DEFAULT false,
  requires_confirm boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read templates"
  ON public.notification_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Founders manage templates"
  ON public.notification_templates FOR ALL TO authenticated
  USING (public.is_founder()) WITH CHECK (public.is_founder());

CREATE TRIGGER trg_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_liveops_updated_at();

ALTER TABLE public.push_campaigns ADD COLUMN IF NOT EXISTS open_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.push_deliveries ADD COLUMN IF NOT EXISTS clicked_at timestamptz;

CREATE OR REPLACE FUNCTION public.record_push_open(_campaign_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _uid uuid := auth.uid(); _updated int := 0;
BEGIN
  IF _uid IS NULL OR _campaign_id IS NULL THEN RETURN false; END IF;
  UPDATE public.push_deliveries
     SET clicked_at = now()
   WHERE campaign_id = _campaign_id AND user_id = _uid AND clicked_at IS NULL;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated > 0 THEN
    UPDATE public.push_campaigns SET open_count = open_count + 1 WHERE id = _campaign_id;
  END IF;
  RETURN true;
END;$$;

GRANT EXECUTE ON FUNCTION public.record_push_open(uuid) TO authenticated;

-- Automatic push delivery for every in-app notification.
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.tg_notifications_auto_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Campaign mirrors are pushed by the campaign sender; don't double-send.
  IF COALESCE(NEW.metadata, '{}'::jsonb) ? 'campaign_id' THEN
    RETURN NEW;
  END IF;
  PERFORM net.http_post(
    url := 'https://project--2e76d25e-fc90-48ab-afb4-e8d7ed375aca.lovable.app/api/public/hooks/push-notify',
    headers := '{"Content-Type":"application/json","apikey":"sb_publishable_9y1SsLTrwdlpAwiLIsv_-g_3mlKl0L4"}'::jsonb,
    body := jsonb_build_object('notification_id', NEW.id)
  );
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_notifications_auto_push ON public.notifications;
CREATE TRIGGER trg_notifications_auto_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.tg_notifications_auto_push();

-- Title unlocked
CREATE OR REPLACE FUNCTION public.tg_player_titles_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE t RECORD;
BEGIN
  SELECT name, icon INTO t FROM public.titles WHERE id = NEW.title_id;
  PERFORM public.notify_user(NEW.user_id, 'title_unlocked',
    '🎖️ New title unlocked',
    'You earned the title "' || COALESCE(t.name,'Adventurer') || '". Equip it from your profile.',
    COALESCE(t.icon,'🎖️'), '/titles', 20,
    jsonb_build_object('title_id', NEW.title_id));
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_player_titles_notify ON public.player_titles;
CREATE TRIGGER trg_player_titles_notify
  AFTER INSERT ON public.player_titles
  FOR EACH ROW EXECUTE FUNCTION public.tg_player_titles_notify();

-- Achievement completed
CREATE OR REPLACE FUNCTION public.tg_player_achievements_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE a RECORD;
BEGIN
  IF NEW.completed IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.completed IS TRUE THEN RETURN NEW; END IF;
  SELECT name, icon, slug INTO a FROM public.achievements WHERE id = NEW.achievement_id;
  PERFORM public.notify_user(NEW.user_id, 'achievement_unlocked',
    '🏅 Achievement unlocked',
    'You unlocked "' || COALESCE(a.name,'an achievement') || '". Nice work, explorer.',
    COALESCE(a.icon,'🏅'), '/achievements/' || COALESCE(a.slug,''), 20,
    jsonb_build_object('achievement_id', NEW.achievement_id));
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_player_achievements_notify ON public.player_achievements;
CREATE TRIGGER trg_player_achievements_notify
  AFTER INSERT OR UPDATE OF completed ON public.player_achievements
  FOR EACH ROW EXECUTE FUNCTION public.tg_player_achievements_notify();

-- Collection completed
CREATE OR REPLACE FUNCTION public.tg_player_collections_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE c RECORD;
BEGIN
  IF NEW.completed IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.completed IS TRUE THEN RETURN NEW; END IF;
  SELECT name, icon, slug INTO c FROM public.collections WHERE id = NEW.collection_id;
  PERFORM public.notify_user(NEW.user_id, 'collection_completed',
    '📚 Collection complete',
    'You completed "' || COALESCE(c.name,'a collection') || '". Rewards are in your profile.',
    COALESCE(c.icon,'📚'), '/collections/' || COALESCE(c.slug,''), 25,
    jsonb_build_object('collection_id', NEW.collection_id));
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_player_collections_notify ON public.player_collections;
CREATE TRIGGER trg_player_collections_notify
  AFTER INSERT OR UPDATE OF completed ON public.player_collections
  FOR EACH ROW EXECUTE FUNCTION public.tg_player_collections_notify();

-- Welcome
CREATE OR REPLACE FUNCTION public.tg_profiles_welcome_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.notify_user(NEW.id, 'system',
    '👋 Welcome to SideQuest',
    'Your adventure starts now, ' || COALESCE(NEW.display_name, NEW.username) || '. Find your first quest nearby.',
    '🧭', '/quests', 30, '{}'::jsonb);
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_profiles_welcome_notify ON public.profiles;
CREATE TRIGGER trg_profiles_welcome_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_welcome_notify();

-- Moderation: suspension / restoration
CREATE OR REPLACE FUNCTION public.tg_profiles_moderation_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.suspended_at IS NULL AND NEW.suspended_at IS NOT NULL THEN
    PERFORM public.notify_user(NEW.id, 'system',
      '🚫 Account suspended',
      'Your account has been temporarily suspended. Reason: ' ||
      COALESCE(NULLIF(NEW.suspended_reason,''),'Community guideline violation') ||
      '. If you believe this is incorrect you may submit an appeal.',
      '🚫', '/rules', 90, jsonb_build_object('reason', NEW.suspended_reason));
  ELSIF OLD.suspended_at IS NOT NULL AND NEW.suspended_at IS NULL THEN
    PERFORM public.notify_user(NEW.id, 'system',
      '✅ Account restored',
      'Welcome back! Your account has been restored. Enjoy your next adventure.',
      '✅', '/home', 50, '{}'::jsonb);
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_profiles_moderation_notify ON public.profiles;
CREATE TRIGGER trg_profiles_moderation_notify
  AFTER UPDATE OF suspended_at ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_moderation_notify();
