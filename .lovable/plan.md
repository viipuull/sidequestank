
# Prompt 9 — Social, Leaderboards & Community

Additive layer on top of the existing platform. No existing screen or route is redesigned; existing systems (XP, titles, achievements, collections, gameplay) stay intact and become inputs to the new social surfaces.

## 1. Database (new migration)

New tables in `public`, all with GRANTs + RLS in the same migration:

- `player_social_settings` — one row per user, controls visibility (`public_profile`, `show_stats`, `show_achievements`, `show_collections`, `show_titles`, `appear_on_leaderboard`, `allow_friend_requests`, `allow_followers`, `moderation_hidden`). Auto-created via trigger on `profiles` insert.
- `player_stats` — denormalized rollup (`total_xp`, `level`, `quests_completed`, `collections_completed`, `achievements_earned`, `titles_earned`, `cities_explored`, `last_active_at`, `join_date`). Maintained by triggers on `player_progress`, `player_achievements`, `player_titles`, `player_collections`.
- `leaderboard_snapshots` — `scope` (`global|country|state|city|event|friends|team`), `scope_key` (nullable text, e.g. city name), `period` (`all_time|weekly|monthly|seasonal`), `period_key` (e.g. `2026-W30`, `2026-07`, `season-1`), `season_id` (nullable), `user_id`, `rank`, `xp`, `level`, `quests`, `collections`, `computed_at`. Unique `(scope, scope_key, period, period_key, user_id)`.
- `leaderboard_seasons` — id, name, starts_at, ends_at, active. Managed in Founder Studio.
- `featured_players` — spotlight rows managed by founders (user_id, blurb, priority, active).
- `activity_events` — feed items (`user_id`, `kind` [`quest_completed|level_up|title_unlocked|achievement_unlocked|collection_completed`], `ref_id`, `payload jsonb`, `created_at`, `visibility`). Public feed reads only where the acting user's `public_profile = true AND moderation_hidden = false`.

Ranking view / SQL: `compute_leaderboard(scope, scope_key, period, period_key)` — SECURITY DEFINER function that recomputes rows into `leaderboard_snapshots` for that slice. Ordered by `total_xp DESC, level DESC, quests_completed DESC, collections_completed DESC, join_date ASC`.

Triggers append `activity_events` when XP is awarded, title/achievement/collection completes (piggyback on existing RPCs — small extensions inside those functions).

## 2. Backend server functions (`src/lib/social.functions.ts`, `leaderboards.functions.ts`, `activity.functions.ts`)

- `getMySocialSettings`, `updateMySocialSettings` (auth).
- `getPublicProfile({ username })` — respects visibility; returns profile, stats, equipped title, featured badges, recent activity, ranks (global/city), member since.
- `discoverPlayers({ query, sort, city, limit, cursor })` — sorts: top_xp, top_level, most_collections, most_achievements, most_active, newest.
- `getLeaderboard({ scope, scope_key, period, period_key, limit, cursor })` + `getMyRank(...)`.
- `getActivityFeed({ scope, cursor })` — global or by user.
- `comparePlayers({ userIdA, userIdB })`.
- `generateShareCard({ kind, ref_id })` — returns structured data for the client canvas share card.
- Founder-only: `listSeasons`, `createSeason`, `resetSeason`, `setFeaturedPlayer`, `moderateVisibility({ user_id, hidden })`, `recomputeLeaderboards(period)`.

All privacy checks in server fns; a hidden or private profile returns 404-ish shape.

## 3. Player-facing routes (all new files, no existing routes touched)

- `src/routes/leaderboard.tsx` — tabs (Global / City / Weekly / Monthly / All-Time), search, sticky "My Position" row, paginated list, rank change animation.
- `src/routes/players.tsx` — Discover Players (search + sort chips + featured spotlight strip).
- `src/routes/players.$username.tsx` — public RPG-style profile.
- `src/routes/players.$username.compare.tsx` — head-to-head comparison vs current user.
- `src/routes/activity.tsx` — global activity feed.
- `src/routes/settings.social.tsx` — social & privacy toggles.
- `src/routes/share.$kind.$id.tsx` — shareable card page (also used for canvas capture / OG image).

Bottom nav's existing Leaderboard tab is rewired to `/leaderboard` (currently placeholder). Profile menu gets links to Social Settings and Public Profile preview. No visual redesign of existing screens — just new entries.

## 4. Components (`src/components/social/`)

`PlayerCard`, `LeaderboardRow`, `RankBadge`, `RankChange`, `StatCounter` (animated), `ActivityItem`, `ShareCard` (canvas-based image export), `ProfileHeader`, `CompareTable`, `FeaturedPlayerStrip`, `SocialToggleRow`.

Framer Motion for row reveal, rank delta arrows, counter tweens, share card entrance.

## 5. Founder Studio (`/founder/social`)

- Season manager (create/reset/close, view active).
- Featured players (search user, add blurb, order).
- Moderation queue (hide/restore visibility, remove from leaderboards).
- Leaderboard analytics (top-N by scope, participation counts).
- Manual "Recompute now" trigger.

Linked from `founder.index.tsx` alongside the other manager tiles.

## 6. Security & performance

- RLS: `player_social_settings` read = own or `public_profile=true`; write = own. `player_stats` public read gated by settings. `activity_events` public read gated by settings + moderation flag. `leaderboard_snapshots` public read (already filtered on write to opted-in users). Founder-only writes on seasons/featured/moderation.
- Ranking done in SQL with proper indexes on `(scope, scope_key, period, period_key, rank)` and `(user_id)`.
- Pagination via keyset (`rank > cursor`). React Query caching with 60s stale for leaderboards.

## 7. Future-ready hooks

Scope enum includes `friends|team|event`; `activity_events.visibility` supports `public|friends|guild|private`; `player_social_settings.allow_friend_requests/allow_followers` already present. No hardcoded assumptions.

## Technical notes

- Migration order: types/enums → tables → GRANTs → RLS → policies → triggers → seed active season.
- Extend existing `award_quest_completion_xp`, `evaluate_titles_for_user`, `evaluate_achievements_for_user`, and the collection-complete path to insert into `activity_events` and bump `player_stats` in the same transaction (idempotent).
- `computeLeaderboard` runs on-demand from server fn; nightly cron via `/api/public/cron/leaderboards` route (guarded by `CRON_SECRET`) recomputes weekly/monthly/seasonal slices.

## Non-goals for this prompt

Friends/followers/guilds actual send-request flows, messaging, marketplace, real social-media posting APIs. Architecture supports them; UI is stubbed as "Coming soon" where appropriate.
