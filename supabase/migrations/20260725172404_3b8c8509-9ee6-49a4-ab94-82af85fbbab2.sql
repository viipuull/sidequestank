
-- ============ ROLES ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('player', 'founder');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_founder()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'founder');
$$;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_founder());

DROP POLICY IF EXISTS "Founders manage roles" ON public.user_roles;
CREATE POLICY "Founders manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_founder()) WITH CHECK (public.is_founder());

-- Seed founder + player roles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'founder'::public.app_role FROM auth.users u
WHERE lower(u.email) = 'ankleshwarweb@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'player'::public.app_role FROM public.profiles p
ON CONFLICT DO NOTHING;

-- Assign player role to every newly created profile
CREATE OR REPLACE FUNCTION public.tg_profiles_assign_player_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'player')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_assign_player_role ON public.profiles;
CREATE TRIGGER profiles_assign_player_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_assign_player_role();

-- ============ QUEST ENUMS ============
DO $$ BEGIN CREATE TYPE public.quest_category AS ENUM (
  'exploration','food','culture','nature','history','photography','trivia','fitness','nightlife','community'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.quest_difficulty AS ENUM ('easy','medium','hard','expert');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.quest_type AS ENUM (
  'walking','photo','trivia','treasure_hunt','gps_checkin','qr_hunt','event','limited_time'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.quest_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.quest_visibility AS ENUM ('public','unlisted','private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.objective_type AS ENUM (
  'visit_location','gps_checkin','scan_qr','take_photo','answer_trivia','collect_item','custom'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ QUESTS ============
CREATE TABLE IF NOT EXISTS public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text NOT NULL DEFAULT '',
  full_description text NOT NULL DEFAULT '',
  cover_image_url text,
  gallery_urls text[] NOT NULL DEFAULT '{}',
  category public.quest_category NOT NULL DEFAULT 'exploration',
  quest_type public.quest_type NOT NULL DEFAULT 'walking',
  difficulty public.quest_difficulty NOT NULL DEFAULT 'easy',
  estimated_minutes integer NOT NULL DEFAULT 30 CHECK (estimated_minutes > 0),
  address text,
  latitude double precision,
  longitude double precision,
  city text NOT NULL DEFAULT 'Ankleshwar',
  reward_preview text NOT NULL DEFAULT '',
  reward_xp integer NOT NULL DEFAULT 0 CHECK (reward_xp >= 0),
  tags text[] NOT NULL DEFAULT '{}',
  visibility public.quest_visibility NOT NULL DEFAULT 'public',
  status public.quest_status NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX IF NOT EXISTS quests_status_idx ON public.quests (status);
CREATE INDEX IF NOT EXISTS quests_featured_idx ON public.quests (featured) WHERE featured;
CREATE INDEX IF NOT EXISTS quests_category_idx ON public.quests (category);
CREATE INDEX IF NOT EXISTS quests_city_idx ON public.quests (city);
CREATE INDEX IF NOT EXISTS quests_created_at_idx ON public.quests (created_at DESC);

GRANT SELECT ON public.quests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quests TO authenticated;
GRANT ALL ON public.quests TO service_role;

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published public quests" ON public.quests;
CREATE POLICY "Public can view published public quests" ON public.quests
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND visibility = 'public');

DROP POLICY IF EXISTS "Founders view all quests" ON public.quests;
CREATE POLICY "Founders view all quests" ON public.quests
  FOR SELECT TO authenticated USING (public.is_founder());

DROP POLICY IF EXISTS "Founders insert quests" ON public.quests;
CREATE POLICY "Founders insert quests" ON public.quests
  FOR INSERT TO authenticated WITH CHECK (public.is_founder() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Founders update quests" ON public.quests;
CREATE POLICY "Founders update quests" ON public.quests
  FOR UPDATE TO authenticated USING (public.is_founder()) WITH CHECK (public.is_founder());

DROP POLICY IF EXISTS "Founders delete quests" ON public.quests;
CREATE POLICY "Founders delete quests" ON public.quests
  FOR DELETE TO authenticated USING (public.is_founder());

CREATE OR REPLACE FUNCTION public.tg_quests_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now();
  IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS quests_updated_at ON public.quests;
CREATE TRIGGER quests_updated_at BEFORE UPDATE ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.tg_quests_updated_at();

-- ============ OBJECTIVES ============
CREATE TABLE IF NOT EXISTS public.quest_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  objective_type public.objective_type NOT NULL DEFAULT 'custom',
  completion_order integer NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quest_objectives_quest_id_idx ON public.quest_objectives (quest_id, completion_order);

GRANT SELECT ON public.quest_objectives TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quest_objectives TO authenticated;
GRANT ALL ON public.quest_objectives TO service_role;

ALTER TABLE public.quest_objectives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view objectives of public published quests" ON public.quest_objectives;
CREATE POLICY "Public view objectives of public published quests" ON public.quest_objectives
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.quests q
      WHERE q.id = quest_id AND q.status = 'published' AND q.visibility = 'public')
  );

DROP POLICY IF EXISTS "Founders manage objectives" ON public.quest_objectives;
CREATE POLICY "Founders manage objectives" ON public.quest_objectives
  FOR ALL TO authenticated USING (public.is_founder()) WITH CHECK (public.is_founder());

DROP TRIGGER IF EXISTS quest_objectives_updated_at ON public.quest_objectives;
CREATE TRIGGER quest_objectives_updated_at BEFORE UPDATE ON public.quest_objectives
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();
