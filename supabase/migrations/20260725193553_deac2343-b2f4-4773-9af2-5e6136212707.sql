
CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  target_kind text NOT NULL,
  target_id uuid,
  summary text,
  before jsonb NOT NULL DEFAULT '{}'::jsonb,
  after jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_created_at_idx ON public.audit_events (created_at DESC);
CREATE INDEX audit_events_actor_idx ON public.audit_events (actor_id, created_at DESC);
CREATE INDEX audit_events_target_idx ON public.audit_events (target_kind, target_id, created_at DESC);

GRANT SELECT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders read audit events" ON public.audit_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'founder'));

-- No INSERT/UPDATE/DELETE policies: only service_role writes.

CREATE OR REPLACE FUNCTION public.record_audit(
  _action text,
  _target_kind text,
  _target_id uuid,
  _summary text DEFAULT NULL,
  _before jsonb DEFAULT '{}'::jsonb,
  _after jsonb DEFAULT '{}'::jsonb,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _id uuid;
  _email text;
  _uid uuid := auth.uid();
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  INSERT INTO public.audit_events
    (actor_id, actor_email, action, target_kind, target_id, summary, before, after, metadata)
  VALUES (_uid, _email, _action, _target_kind, _target_id, _summary,
          COALESCE(_before,'{}'::jsonb), COALESCE(_after,'{}'::jsonb), COALESCE(_metadata,'{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END; $$;

REVOKE ALL ON FUNCTION public.record_audit(text, text, uuid, text, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_audit(text, text, uuid, text, jsonb, jsonb, jsonb) TO authenticated;
