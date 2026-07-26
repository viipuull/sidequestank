-- 1) Extend enum
ALTER TYPE objective_progress_status ADD VALUE IF NOT EXISTS 'pending_review';

-- 2) Reviewer columns
ALTER TABLE public.objective_progress
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes text;

CREATE INDEX IF NOT EXISTS idx_objective_progress_status ON public.objective_progress(status);

-- 3) Approve
CREATE OR REPLACE FUNCTION public.founder_approve_photo(_progress_id uuid, _notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _prog record;
  _session record;
  _quest record;
  _all_objs int;
  _completed int;
  _remaining_required int;
  _award jsonb := NULL;
  _quest_completed boolean := false;
BEGIN
  PERFORM public._assert_founder();

  SELECT * INTO _prog FROM public.objective_progress WHERE id = _progress_id;
  IF _prog IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;

  IF _prog.status = 'completed' THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  SELECT * INTO _session FROM public.quest_sessions WHERE id = _prog.session_id;
  SELECT * INTO _quest FROM public.quests WHERE id = _session.quest_id;

  UPDATE public.objective_progress
     SET status = 'completed'::objective_progress_status,
         verified_at = now(),
         reviewed_by = _actor,
         reviewed_at = now(),
         review_notes = COALESCE(_notes, review_notes),
         updated_at = now()
   WHERE id = _progress_id;

  -- Check if quest is now complete
  SELECT count(*) INTO _all_objs FROM public.quest_objectives WHERE quest_id = _session.quest_id;
  SELECT count(*) INTO _remaining_required
    FROM public.quest_objectives o
    WHERE o.quest_id = _session.quest_id
      AND o.required
      AND NOT EXISTS (
        SELECT 1 FROM public.objective_progress p
        WHERE p.session_id = _session.id AND p.objective_id = o.id AND p.status = 'completed'::objective_progress_status
      );

  IF _all_objs > 0 AND _remaining_required = 0 AND _session.status <> 'completed' THEN
    UPDATE public.quest_sessions
       SET status = 'completed', completed_at = now(), last_activity_at = now()
     WHERE id = _session.id;
    _quest_completed := true;
    SELECT public.award_quest_completion_xp(_session.id) INTO _award;
    PERFORM public.update_collection_progress_for_user(_session.user_id, _session.quest_id);
    PERFORM public.evaluate_titles_for_user(_session.user_id);
    PERFORM public.evaluate_achievements_for_user(_session.user_id);
  END IF;

  -- Notify player
  PERFORM public.notify_user(
    _session.user_id,
    CASE WHEN _quest_completed THEN 'quest_completed'::notification_kind ELSE 'system'::notification_kind END,
    CASE WHEN _quest_completed THEN 'Quest complete!' ELSE 'Photo approved' END,
    CASE WHEN _quest_completed
         THEN 'Your photo for "' || COALESCE(_quest.title,'quest') || '" was approved and the quest is complete.'
         ELSE 'Your photo submission was approved. Keep exploring!' END,
    '📸',
    '/quests/' || _quest.slug,
    2,
    jsonb_build_object('quest_id', _quest.id, 'progress_id', _progress_id)
  );

  PERFORM public.record_audit(
    'photo_approve', 'objective_progress', _progress_id,
    'Approved photo submission',
    to_jsonb(_prog), jsonb_build_object('status','completed','notes',_notes),
    jsonb_build_object('user_id', _session.user_id, 'quest_id', _quest.id)
  );

  RETURN jsonb_build_object('ok', true, 'quest_completed', _quest_completed, 'award', _award);
END;
$$;

-- 4) Reject
CREATE OR REPLACE FUNCTION public.founder_reject_photo(_progress_id uuid, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _prog record;
  _session record;
  _quest record;
BEGIN
  PERFORM public._assert_founder();

  IF _reason IS NULL OR length(trim(_reason)) = 0 THEN
    RAISE EXCEPTION 'Rejection reason required';
  END IF;

  SELECT * INTO _prog FROM public.objective_progress WHERE id = _progress_id;
  IF _prog IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;

  IF _prog.status = 'completed' THEN
    RAISE EXCEPTION 'Cannot reject an already-approved submission';
  END IF;

  SELECT * INTO _session FROM public.quest_sessions WHERE id = _prog.session_id;
  SELECT * INTO _quest FROM public.quests WHERE id = _session.quest_id;

  UPDATE public.objective_progress
     SET status = 'pending'::objective_progress_status,
         verified_at = NULL,
         reviewed_by = _actor,
         reviewed_at = now(),
         review_notes = _reason,
         updated_at = now()
   WHERE id = _progress_id;

  PERFORM public.notify_user(
    _session.user_id,
    'system'::notification_kind,
    'Photo needs another try',
    'Your submission was rejected: ' || _reason,
    '📷',
    '/quests/' || _quest.slug || '/play',
    3,
    jsonb_build_object('quest_id', _quest.id, 'progress_id', _progress_id, 'reason', _reason)
  );

  PERFORM public.record_audit(
    'photo_reject', 'objective_progress', _progress_id,
    'Rejected photo submission',
    to_jsonb(_prog), jsonb_build_object('status','pending','reason',_reason),
    jsonb_build_object('user_id', _session.user_id, 'quest_id', _quest.id)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.founder_approve_photo(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.founder_reject_photo(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.founder_approve_photo(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.founder_reject_photo(uuid, text) TO authenticated;