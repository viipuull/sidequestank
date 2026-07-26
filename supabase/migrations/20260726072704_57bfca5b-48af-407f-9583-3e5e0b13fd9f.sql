
-- 1) Leaderboard: restrict public read to opted-in, non-hidden players
DROP POLICY IF EXISTS "leaderboard_public_read" ON public.leaderboard_snapshots;
CREATE POLICY "leaderboard_public_read" ON public.leaderboard_snapshots
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.player_social_settings s
      WHERE s.user_id = leaderboard_snapshots.user_id
        AND s.appear_on_leaderboard = true
        AND s.moderation_hidden = false
    )
  );

-- 2) quest-media: exclude private submissions/ from the general public read
DROP POLICY IF EXISTS "quest-media read" ON storage.objects;
CREATE POLICY "quest-media read" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'quest-media'
    AND (storage.foldername(name))[1] IS DISTINCT FROM 'submissions'
  );
