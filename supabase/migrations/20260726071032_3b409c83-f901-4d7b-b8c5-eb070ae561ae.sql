
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_bucket text NOT NULL DEFAULT 'quest-media',
  storage_path text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  width integer,
  height integer,
  url text NOT NULL,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_bucket, storage_path)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_assets founders select" ON public.media_assets
  FOR SELECT TO authenticated USING (public.is_founder());
CREATE POLICY "media_assets founders insert" ON public.media_assets
  FOR INSERT TO authenticated WITH CHECK (public.is_founder());
CREATE POLICY "media_assets founders update" ON public.media_assets
  FOR UPDATE TO authenticated USING (public.is_founder()) WITH CHECK (public.is_founder());
CREATE POLICY "media_assets founders delete" ON public.media_assets
  FOR DELETE TO authenticated USING (public.is_founder());

CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON public.media_assets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_mime ON public.media_assets (mime_type);

CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();
