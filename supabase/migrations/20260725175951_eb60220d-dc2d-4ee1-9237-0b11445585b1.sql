-- Enums
DO $$ BEGIN
  CREATE TYPE public.session_status AS ENUM ('active','paused','completed','abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.objective_progress_status AS ENUM ('pending','completed','failed','skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- quest_sessions
CREATE TABLE IF NOT EXISTS public.quest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.session_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS quest_sessions_one_open_per_quest
  ON public.quest_sessions(user_id, quest_id)
  WHERE status IN ('active','paused');

CREATE INDEX IF NOT EXISTS quest_sessions_user_status_idx
  ON public.quest_sessions(user_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quest_sessions TO authenticated;
GRANT ALL ON public.quest_sessions TO service_role;
ALTER TABLE public.quest_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON public.quest_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Founders view all sessions" ON public.quest_sessions
  FOR SELECT TO authenticated
  USING (public.is_founder());

DROP TRIGGER IF EXISTS tg_quest_sessions_updated_at ON public.quest_sessions;
CREATE TRIGGER tg_quest_sessions_updated_at
  BEFORE UPDATE ON public.quest_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();

-- objective_progress
CREATE TABLE IF NOT EXISTS public.objective_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quest_sessions(id) ON DELETE CASCADE,
  objective_id uuid NOT NULL REFERENCES public.quest_objectives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.objective_progress_status NOT NULL DEFAULT 'pending',
  verification_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts integer NOT NULL DEFAULT 0,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, objective_id)
);

CREATE INDEX IF NOT EXISTS objective_progress_session_idx
  ON public.objective_progress(session_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.objective_progress TO authenticated;
GRANT ALL ON public.objective_progress TO service_role;
ALTER TABLE public.objective_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own progress" ON public.objective_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Founders view all progress" ON public.objective_progress
  FOR SELECT TO authenticated
  USING (public.is_founder());

DROP TRIGGER IF EXISTS tg_objective_progress_updated_at ON public.objective_progress;
CREATE TRIGGER tg_objective_progress_updated_at
  BEFORE UPDATE ON public.objective_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();

-- Storage policies for player photo submissions in quest-media bucket
-- Layout: submissions/<user_id>/<session_id>/<file>
DROP POLICY IF EXISTS "Players upload own submissions" ON storage.objects;
CREATE POLICY "Players upload own submissions" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'quest-media'
    AND (storage.foldername(name))[1] = 'submissions'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Players read own submissions" ON storage.objects;
CREATE POLICY "Players read own submissions" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'quest-media'
    AND (storage.foldername(name))[1] = 'submissions'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Founders read all submissions" ON storage.objects;
CREATE POLICY "Founders read all submissions" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'quest-media'
    AND (storage.foldername(name))[1] = 'submissions'
    AND public.is_founder()
  );