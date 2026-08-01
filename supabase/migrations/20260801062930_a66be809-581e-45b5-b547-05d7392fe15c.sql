-- ============ push_tokens ============
CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'web',
  user_agent text,
  enabled boolean NOT NULL DEFAULT true,
  invalid_at timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_tokens_user_idx ON public.push_tokens(user_id) WHERE invalid_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tokens select" ON public.push_tokens FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_founder());
CREATE POLICY "own tokens insert" ON public.push_tokens FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own tokens update" ON public.push_tokens FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own tokens delete" ON public.push_tokens FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============ enums ============
CREATE TYPE public.push_kind AS ENUM (
  'new_quest_nearby','quest_reminder','event_reminder','achievement_unlocked',
  'level_up','collection_completed','founder_announcement','daily_reminder','weekly_summary'
);
CREATE TYPE public.push_campaign_status AS ENUM ('draft','scheduled','sending','sent','failed','cancelled');
CREATE TYPE public.push_audience_kind AS ENUM ('everyone','player','level','title','city','event');

-- ============ push_campaigns ============
CREATE TABLE public.push_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  deep_link text NOT NULL DEFAULT '/home',
  action_label text,
  action_url text,
  kind public.push_kind NOT NULL DEFAULT 'founder_announcement',
  audience_kind public.push_audience_kind NOT NULL DEFAULT 'everyone',
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.push_campaign_status NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipients_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  failure_count integer NOT NULL DEFAULT 0,
  error text,
  also_inbox boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_campaigns_due_idx ON public.push_campaigns(scheduled_at) WHERE status = 'scheduled';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_campaigns TO authenticated;
GRANT ALL ON public.push_campaigns TO service_role;
ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founders read campaigns" ON public.push_campaigns FOR SELECT TO authenticated
  USING (public.is_founder());
CREATE POLICY "founders write campaigns" ON public.push_campaigns FOR INSERT TO authenticated
  WITH CHECK (public.is_founder());
CREATE POLICY "founders update campaigns" ON public.push_campaigns FOR UPDATE TO authenticated
  USING (public.is_founder()) WITH CHECK (public.is_founder());
CREATE POLICY "founders delete campaigns" ON public.push_campaigns FOR DELETE TO authenticated
  USING (public.is_founder());

-- ============ push_deliveries ============
CREATE TABLE public.push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.push_campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  token_tail text,
  success boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_deliveries_campaign_idx ON public.push_deliveries(campaign_id);

GRANT SELECT ON public.push_deliveries TO authenticated;
GRANT ALL ON public.push_deliveries TO service_role;
ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founders read deliveries" ON public.push_deliveries FOR SELECT TO authenticated
  USING (public.is_founder());

-- ============ triggers ============
CREATE TRIGGER push_tokens_updated_at BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.tg_liveops_updated_at();
CREATE TRIGGER push_campaigns_updated_at BEFORE UPDATE ON public.push_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.tg_liveops_updated_at();

-- ============ audience resolver ============
CREATE OR REPLACE FUNCTION public.resolve_push_audience(_kind public.push_audience_kind, _audience jsonb)
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _kind = 'everyone' THEN
    RETURN QUERY SELECT p.id FROM public.profiles p WHERE p.suspended_at IS NULL;
  ELSIF _kind = 'player' THEN
    RETURN QUERY SELECT p.id FROM public.profiles p
      WHERE p.id = NULLIF(_audience->>'user_id','')::uuid;
  ELSIF _kind = 'level' THEN
    RETURN QUERY SELECT p.id FROM public.profiles p
      WHERE p.suspended_at IS NULL
        AND p.level >= COALESCE(NULLIF(_audience->>'min_level','')::int, 1)
        AND p.level <= COALESCE(NULLIF(_audience->>'max_level','')::int, 999);
  ELSIF _kind = 'title' THEN
    RETURN QUERY SELECT DISTINCT pt.user_id FROM public.player_titles pt
      WHERE pt.title_id = NULLIF(_audience->>'title_id','')::uuid;
  ELSIF _kind = 'city' THEN
    RETURN QUERY SELECT p.id FROM public.profiles p
      WHERE p.suspended_at IS NULL
        AND lower(p.city) = lower(COALESCE(_audience->>'city',''));
  ELSIF _kind = 'event' THEN
    RETURN QUERY SELECT DISTINCT pe.user_id FROM public.player_events pe
      WHERE pe.event_id = NULLIF(_audience->>'event_id','')::uuid AND pe.joined = true;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_push_audience(public.push_audience_kind, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_push_audience(public.push_audience_kind, jsonb) TO service_role;