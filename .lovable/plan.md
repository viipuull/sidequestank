# SideQuest — Prompt 10: LiveOps, Events & Notifications

Build a full LiveOps layer on top of the existing quest / XP / titles / achievements / collections / social systems. **Purely additive** — no existing screens redesigned, no existing tables changed, no existing routes removed.

---

## 1. Database (one migration)

New tables (all under `public`, with GRANTs, RLS, updated_at triggers):

- **events** — LiveOps events. Columns include `event_type` (enum: `daily_quest_set`, `weekly_challenge`, `monthly_challenge`, `seasonal`, `holiday`, `limited_time`, `founder`, `community`, `beta`, `sponsored`), `status` (draft/scheduled/live/ended/archived), `visibility`, `starts_at`, `ends_at`, `timezone`, `banner_url`, `cover_url`, `icon`, `featured`, `priority`, `max_participants`, `repeatable`, `config jsonb` (extensible — reward multipliers, exclusive quest ids, etc.), `community_goal int`, `community_progress int`.
- **event_rewards** — many rewards per event (`kind`: xp / title / achievement / collection / badge_image, references + amounts).
- **event_quests** — pins/features specific quests to an event with a display order (drives Limited-Time Quests & Featured pools).
- **challenges** — reusable challenge templates: `metric` (quests_completed / xp_earned / locations_visited / qr_scans / photos / collections_completed / achievements_unlocked / level_reached), `target`, `reset_frequency` (none/daily/weekly/monthly), `reward_xp`, `reward_title_id`, `reward_achievement_id`, `active`, `visibility`.
- **event_challenges** — join table so an event bundles N challenges.
- **player_events** — per-player join/progress on an event (`percent`, `completed`, `reward_granted`, `contribution` for community events).
- **player_challenges** — per-player challenge progress with `period_start` (so daily/weekly/monthly rows are one-per-period-per-player via unique index).
- **notifications** — in-app notifications: `kind`, `title`, `body`, `icon`, `deep_link`, `priority`, `read_at`, `created_at`.
- **announcements** — founder-authored broadcasts with `priority`, `visibility`, `starts_at`, `ends_at`, `banner_url`, `deep_link`.
- **announcement_reads** — per-user dismissal state.
- **featured_quests** — pin/boost with `starts_at`/`ends_at`/`priority` (does not modify `quests`).

Helper SQL:

- Function `public.current_period_start(freq text) → timestamptz` (UTC-day / ISO-week / month).
- Function `public.progress_challenges_for_user(_user_id uuid, _delta jsonb)` — bumps every active `player_challenges` row for that user matching the metric, upserts row for current period, grants reward + notification when target hit (idempotent per period).
- Function `public.progress_event_for_user(_user_id uuid, _event_id uuid, _delta int)` — same shape for community goals.
- Function `public.reset_periodic_challenges()` — closes expired challenge periods and archives old rows.
- Function `public.tick_liveops()` — publishes scheduled events (`scheduled → live`), ends expired events (`live → ended`), grants completion rewards, ensures a "today" `daily_quest_set` event exists.
- Function `public.notify_user(...)` — writes into `notifications` (used everywhere).

Existing `award_quest_completion_xp` and `submitObjective` will call `progress_challenges_for_user` in the same transaction so every gameplay event advances LiveOps.

RLS: players see their own `player_events`, `player_challenges`, `notifications`, and public `events`/`challenges`/`announcements`/`featured_quests` rows within their visibility window. Founders manage everything via `has_role(auth.uid(),'founder')`.

## 2. Scheduling

TanStack public route `src/routes/api/public/hooks/liveops-tick.ts` calls `tick_liveops()` and `reset_periodic_challenges()`. Insert-tool SQL registers a `pg_cron` job (every 5 minutes) via `pg_net` with the anon key. This gives us automatic publish / archive / resets without any manual intervention.

## 3. Server functions (`src/lib/*.functions.ts`)

- `events.functions.ts` — list active/upcoming events, event detail (with rewards, challenges, quests, community progress), join event, calendar range fetch, founder CRUD (create/update/duplicate/archive/restore/publish/unpublish), preview.
- `challenges.functions.ts` — my daily/weekly/monthly, all-active list, founder CRUD, attach/detach to events.
- `notifications.functions.ts` — list/paginate mine, unread count, mark read / mark all / delete, filters.
- `announcements.functions.ts` — active for me, dismiss, founder CRUD.
- `featured.functions.ts` — active featured quests, founder pin/unpin.
- `liveops.functions.ts` — founder metrics (active/upcoming/ending-soon counts, participation, completion rates, notification volume).

All player-facing writes are `.middleware([requireSupabaseAuth])`. Public reads (`activeAnnouncements`, `featuredQuests`) use the server publishable client for SSR-safety.

## 4. Player UI (new routes only)

- `/events` — Event Calendar hub with tabs: **Today · Upcoming · Ending Soon · Seasonal · All**. Toggle List / Month view (list default on mobile).
- `/events/$slug` — premium detail page: banner, countdown, description, join/continue CTA, rewards grid, featured quests, challenges checklist, community progress bar, share.
- `/challenges` — daily/weekly/monthly tabs with progress bars and countdown to reset.
- `/notifications` — Notification Center with search, filters, mark-all-read, deep links, unread badge.
- `/announcements` — Founder announcements list; latest also surfaces as a dismissible banner on Home.

Home dashboard gains an additive **LiveOps Rail** block (below existing content): today's daily quests, weekly progress ring, active event card, featured quest, unread announcement banner. Bottom nav is untouched; a small bell badge on the ProfileMenu links to Notifications.

## 5. Founder Studio (new routes only)

- `/founder/liveops` — LiveOps overview: active/upcoming/ending soon, participation snapshot, notification volume, quick-create buttons.
- `/founder/events` — table of events with status pills, quick actions (publish, unpublish, duplicate, archive, restore).
- `/founder/events/new` and `/founder/events/$id` — Event Builder: metadata, dates+timezone, banner/cover/icon upload (reuse `quest-media` bucket), reward composer, challenge picker, quest picker, community goal, preview.
- `/founder/challenges` — CRUD for challenge templates.
- `/founder/announcements` — CRUD with priority, schedule, expiration, banner.
- `/founder/featured` — pin/boost quests with schedule + priority.

Founder dashboard (`/founder`) gets one new "LiveOps Manager" tile linking to `/founder/liveops`.

## 6. Rewards & notifications

`grant_event_rewards(_user_id, _event_id)` runs once per (user,event) when a player completes an event or when a community goal is hit for a participant. It reuses existing paths: `award_quest_completion_xp` logic style for XP, `_grant_title` for titles, `player_achievements` upsert for achievements, and marks `reward_granted=true` on `player_events`. Every reward, level up, challenge completion, event start, and announcement creation writes an in-app notification via `notify_user`.

## 7. UI kit reuse

Reuses existing `AppShell`, `ScreenShell`, `AuthGate`, `GlassCard`, `XpBar`, `BadgeCard`, motion presets, and confetti. New shared components:

- `EventCard`, `EventHeader`, `Countdown`
- `ChallengeRow`, `RewardChip`
- `NotificationItem`, `NotificationBell`
- `AnnouncementBanner`, `CommunityGoalBar`
- `CalendarList` (mobile-first list, optional month grid on `sm+`)

## 8. Technical notes / non-goals

- No email/SMS/native push in this pass. Architecture is push-ready (a `notifications` table + `deep_link` string is the exact schema a future push worker will read), but the shipped surface is in-app.
- Reward multipliers live in `events.config` — awarded XP is multiplied by `config.xp_multiplier` (default 1) inside `award_quest_completion_xp` when the completed quest belongs to a currently live event via `event_quests`.
- Sponsored / guild / battle-pass event kinds are enum values now; no code paths hardcode event_type outside display strings.
- All new tables have `service_role` grants and `authenticated` grants sized to their policies; `anon` grants only on `announcements`, `events` (public visibility, live status), `featured_quests`, and `event_quests` for public event previews.
- Absolutely no changes to auth, profiles, existing quest tables, existing routes, or any file in `src/integrations/supabase/`.

## 9. Rollout order

1. Migration + cron registration (insert tool)
2. Server functions + hooks
3. Player routes (`/events`, `/events/$slug`, `/challenges`, `/notifications`, `/announcements`) + Home LiveOps rail
4. Founder routes (`/founder/liveops`, events, challenges, announcements, featured)
5. Wire `submitObjective` and `award_quest_completion_xp` to `progress_challenges_for_user` + `progress_event_for_user`
6. Typecheck, smoke test, done.
