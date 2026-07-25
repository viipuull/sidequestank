
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_founder() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_founder() TO authenticated, service_role;

DROP POLICY IF EXISTS "quest-media read" ON storage.objects;
CREATE POLICY "quest-media read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'quest-media');

DROP POLICY IF EXISTS "quest-media founders write" ON storage.objects;
CREATE POLICY "quest-media founders write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'quest-media' AND public.is_founder());

DROP POLICY IF EXISTS "quest-media founders update" ON storage.objects;
CREATE POLICY "quest-media founders update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'quest-media' AND public.is_founder());

DROP POLICY IF EXISTS "quest-media founders delete" ON storage.objects;
CREATE POLICY "quest-media founders delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'quest-media' AND public.is_founder());
