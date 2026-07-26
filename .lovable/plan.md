# Photo Proof Review Queue

Add manual approval for photo objectives so founders review submissions in Studio before XP is granted. Rejections reopen the objective and notify the player.

## Database

- Extend `objective_progress_status` enum with `pending_review`.
- On photo submission, write status `pending_review` (not `completed`) with `verification_data.photo_path` and reviewer fields (`reviewed_by`, `reviewed_at`, `review_notes`) added to `objective_progress`.
- New RPCs (SECURITY DEFINER, founder-guarded via `_assert_founder`):
  - `founder_approve_photo(_progress_id uuid, _notes text)` — sets status `completed`, cascades quest-completion + XP the same way GPS/QR do today, records audit, sends notification.
  - `founder_reject_photo(_progress_id uuid, _reason text)` — sets status `pending` (reopen), stores reason in `review_notes`, records audit, sends notification with the reason via `notify_user`.

## Server functions (`src/lib/reviews.functions.ts`)

- `listPhotoReviews({ status, questId, limit, cursor })` — founder-only, returns pending queue with joined quest/objective/player + signed URL for the photo in `quest-media/submissions/…`.
- `approvePhotoSubmission({ progressId, notes })` and `rejectPhotoSubmission({ progressId, reason })` wrapping the RPCs.

## Player-side changes

- `submitObjectiveProgress` `take_photo` branch: return `status: 'pending_review'` instead of completing. Quest completion / XP wait for approval.
- Objective card in `quests.$slug.play.tsx`: show "Awaiting review" pill for `pending_review`; disable resubmit while pending. On rejection notification, objective is `pending` again with the reason surfaced.

## Studio UI

- New route `src/routes/studio.reviews.tsx` (linked from `StudioSidebar` under Content, with pending-count badge from a lightweight count query):
  - Tabs: Pending / Approved / Rejected.
  - Row: player, quest + objective title, submitted-at, photo thumbnail (click = lightbox).
  - Actions: Approve (optional note) and Reject (required reason). Both are optimistic + toast, buttons disable while mutating.
- Command palette entry "Photo reviews".

## Notifications

- Approval: `notification_kind = quest_completed` (or `achievement_unlocked` if quest finishes), deep link to quest.
- Rejection: new copy via existing `notify_user`, kind `system`, deep link back to the play screen; body includes the reason.

## Out of scope

- Bulk approve, auto-moderation, image similarity checks, per-quest override (can be added later as a toggle on the objective config).

## Technical notes

- Storage: submissions already live under `quest-media/submissions/{userId}/…`; signed URLs generated server-side keep them private.
- RLS: no table changes; all review reads/writes go through founder-guarded RPCs + server functions.
- Backwards compatibility: existing completed photo objectives stay `completed`; only new submissions enter `pending_review`.
