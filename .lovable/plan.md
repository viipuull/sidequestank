## What I verified

- **XP can be farmed by replaying a quest — confirmed in live data.** One player has 3 separate "quest completed" XP awards for the *same* quest (300 XP total). Cause: `startOrResumeSession` only resumes `active`/`paused` sessions — once a quest is completed, pressing Start creates a brand-new session, and the XP award is idempotent *per session*, not per quest.
- **Approving another player's photo breaks when it finishes their quest.** The approve routine calls the XP award routine, which rejects any call where the session owner isn't the current user. So a founder approving the final photo of a player's quest hits "Forbidden" and the approval fails. (Read from both database routines.)
- **Photo objectives can be resubmitted freely while pending.** Each new upload overwrites the pending row and resets review state, so a player can spam new photos while one is already in the queue.
- **Admin "Players" page:** I could not reproduce it from here — my test browser has no founder session, so it bounced to the welcome screen. Diagnosing this is step 1 below, not a guess.

## Plan

### 1. Diagnose the admin panel pages that won't open
Reproduce as the founder account in a real browser session and capture the actual error (console + network + server function response) for **Players**, and sweep every Studio sidebar link (Players, Media, Audit, Reviews, Quests, Collections, Achievements, Titles, LiveOps, Social) to find all the dead ones in one pass. Fix what the errors show — likely candidates are a failing admin data call, a route that renders outside the Studio shell, or a stuck loading gate. Also add a visible error state to those screens so a failure shows a message instead of an endless spinner.

### 2. One quest = one XP payout (database)
- Make the XP award unique per player + quest, not per session: a uniqueness rule on completed-quest XP events, and an explicit check in the award routine so a replay returns "already awarded, 0 XP" instead of paying again.
- Introduce a `repeatable` flag on quests (default off). Non-repeatable quests can be replayed for fun, but grant XP, titles, achievements and collection progress only the first time. Repeatable quests keep paying — founder's choice per quest.
- Clean up the existing duplicate awards: recalculate that player's XP/level so the leaderboard reflects the honest total.

### 3. Fix founder photo approval
Let the approve/reject routines complete a quest on the player's behalf (award XP as the session owner instead of as the founder), so approvals never fail with a permission error. Same fix applied to the reject-and-reopen path.

### 4. One submission per objective, locked while pending
- Server-side: once a photo objective is `pending_review`, reject further uploads for that objective until it's approved or rejected. Only a **rejected** submission reopens for a retry (which is exactly your "if you couldn't submit, you can play again" rule).
- Client-side (`quests/$slug/play`): after submitting, the objective card locks into a clear "Submitted — awaiting review" state with the uploaded photo, the upload buttons disappear, and a rejected item shows the reason plus a single "Try again" button.
- Guard the submit button against double-taps so one tap can't create two submissions.

### 5. Small things a player and admin panel need
Player side:
- Completed quests show "Completed — replay for fun (no XP)" instead of a plain Start button, so nobody thinks they're grinding XP.
- Consistent loading / empty / error states on quests, leaderboard, collections and profile — no blank or infinitely spinning screens.
- Clear pending-review count somewhere visible so players know a submission is in the queue.

Admin side:
- Photo Reviews shows the player, quest, objective and the photo full-size, with approve/reject and a rejection reason in one place.
- Players list: working search, filters and pagination, plus quick actions straight from the row.
- Every Studio action gives a success/failure toast instead of silently doing nothing.

## Technical notes

- Changes span: one database migration (uniqueness rule + `repeatable` column + updated `award_quest_completion_xp`, `founder_approve_photo`, `founder_reject_photo`), a data correction for the duplicated XP, `src/lib/gameplay.functions.ts` (resubmission guard, first-completion reward gating), `src/routes/quests.$slug.play.tsx`, `src/routes/quests.$slug.index.tsx`, and the Studio routes found broken in step 1.
- Step 1 runs first because its findings may change what needs fixing in step 5.
- No permissions needed from you — I have everything required. If a Studio page turns out to need a setting I can't reach, I'll flag it explicitly.
