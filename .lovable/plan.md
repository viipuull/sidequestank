## What's actually wrong

I checked the live data. This is confirmed, not a guess:

- Your progress is correct everywhere: `sidequest` is level 2 / 200 XP / 2 quests in both `player_progress` and `player_stats` (updated today).
- The leaderboard does NOT read those tables. It reads a snapshot table that was last computed on **2026-07-25** — six days ago — when everyone was level 1 / 0 XP. That's exactly why the board shows level 1.
- Nothing ever recomputes it. The recompute routine exists but is only callable manually from Studio; the LiveOps tick doesn't call it and nothing schedules it.
- Worse: the weekly board is keyed `2026-W30`. We're now in W31, so the weekly tab currently reads an empty key and shows nothing.
- One player (`bigboyshoubhit`) has no stats row at all, so they can never appear on any board.

## The fix

**1. Leaderboards refresh themselves**
- Recompute is triggered automatically whenever XP is awarded / a quest is completed, so the board reflects reality within seconds of a player finishing a quest.
- Plus a safety net on read: if the requested board is missing or older than ~2 minutes, the read path recomputes it before returning. This kills the "new week = empty board" problem permanently, since the current week/month key gets built on first view.
- Recompute stays throttled so a burst of views can't hammer the database.

**2. Backfill now**
- Recompute all default boards (all-time, weekly W31, monthly 2026-07, seasonal, city) immediately so today's board is correct the moment this ships.
- Create the missing stats rows for any player who has a profile but no stats/progress row, so nobody is invisible.

**3. Keep stats rows from going missing**
- Ensure a stats + progress row is created when a profile is created, not only when XP is first earned.

**4. Small consistency pass on what the board shows**
- Leaderboard rows show the same level/XP source as the profile and Home XP bar, and "your rank" card refreshes with the list instead of caching a stale rank.
- Cache invalidation after quest completion so Home, Profile and Leaderboard all update together without a manual refresh.

## Technical notes

- Migration: add a trigger on `xp_events` (and quest-completion path) that calls `recompute_default_leaderboards()`, guarded by a short throttle using `max(computed_at)`; make `compute_leaderboard` tolerant of a missing active season; add profile-creation trigger for `player_stats` / `player_progress`.
- `src/lib/leaderboards.functions.ts`: before querying `leaderboard_snapshots`, call a new `ensure_leaderboard(scope, scope_key, period, period_key)` security-definer RPC that computes-if-stale, then read as today.
- Data backfill for existing players via the insert tool (not a migration).
- Front end: invalidate leaderboard/profile/progress query keys after quest completion.

## On "there are a lot of small things"

I'll fix these leaderboard issues in this pass. Send me the next batch (or just describe what looked wrong on a screen) and I'll keep knocking them out one sprint at a time — same as this.
