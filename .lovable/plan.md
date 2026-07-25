
# SideQuest Studio Pro — Implementation Plan

The Prompt 11 scope (analytics, players, moderation, content, bulk ops, media library, rewards, LiveOps integration, settings, universal search, filters, audit log, import/export, version history, automation, RBAC, widgets, backend services, security, performance, animations) is roughly 6–10 large feature areas. Shipping all of it in a single pass would take dozens of migrations and hundreds of files, and would risk regressing the working systems (auth, quests, XP, titles, achievements, collections, leaderboards, LiveOps).

To keep quality high and preserve existing functionality, I want to ship this in **4 phased releases**. Each phase leaves the app fully working and each surface production-ready before we move to the next.

## Phase 1 — Foundation & Studio Home (this turn)

Ship the shell and the highest-leverage pieces that unlock everything else.

- **Studio shell**: new `/studio` route (keep `/founder/*` working as aliases → redirect) with a persistent left sidebar (desktop) + drawer (mobile), top bar with universal search input and quick actions. Founder-only guard via existing `has_role('founder')`.
- **Studio Home**: live tiles for player count, today's active players, new players (24h), quests completed today, XP earned today, collections completed today, achievements earned today, upcoming events (next 7 days), recently published quests, recent notifications, quick actions, quick search.
- **Backend services layer**: new `src/lib/studio/` module with `analytics.functions.ts`, `players.functions.ts`, `moderation.functions.ts`, `audit.functions.ts` — thin, typed, founder-gated server functions using `requireSupabaseAuth` + `has_role`.
- **Audit log**: `audit_events` table + `record_audit()` RPC. Every moderation/content mutation from Studio writes to it.
- **Universal search (v1)**: single server fn searching players, quests, collections, events, achievements, titles by name/slug; results grouped by type, opens in a `⌘K`-style command palette.
- Preserve all existing routes; the old `/founder` dashboard stays and links to the new `/studio`.

## Phase 2 — Analytics + Player Management + Moderation

- Analytics dashboard with daily/weekly/monthly/custom range using Recharts (already in stack via shadcn charts).
- Player Manager: searchable/paginated table, profile drawer with XP, level, titles, achievements, collections, activity, notes.
- Moderation actions: suspend/unsuspend, hide/restore profile, grant/remove XP, grant title/badge/collection/achievement, reset progress (typed confirm). All logged to `audit_events`.
- Extend `profiles` with `suspended_at`, `suspension_reason`; RLS updated.

## Phase 3 — Unified Content Manager + Bulk Ops + Media Library + Reward Manager

- Single "Content" hub with tabs (Quests, Collections, Achievements, Titles, Events, Challenges, Announcements, Notifications, Media). Shared table component with status/category/date/creator/difficulty filters + saved filters.
- Bulk publish/archive/soft-delete/restore/category/reward/schedule with confirm dialogs.
- Media Library backed by existing `quest-media` bucket + new `media_assets` table (search, tags, folders, replace, delete, preview).
- Reward Manager consolidates XP / titles / achievements / collections / event rewards editing.

## Phase 4 — Advanced (Version History, Automation, RBAC, Import/Export, Widgets, Settings)

- Version history for quests/collections/events (`*_versions` tables, restore, compare).
- Scheduled publish/archive/notification/announcement (extend `tick_liveops`).
- Granular founder roles: extend `app_role` with `admin`, `content_manager`, `moderator`, `event_manager`, `support`, `analytics_viewer`; permission helper `has_permission()`.
- CSV / JSON export & template import for quests/collections/achievements/events.
- Customizable dashboard widgets (layout persisted per user).
- System Settings (branding, defaults, XP/level formula overrides, maintenance mode, registration toggle, map settings) in `system_settings` singleton table.

## Technical notes (for the technical reader)

- All new server functions live under `src/lib/studio/*.functions.ts`, gated by `requireSupabaseAuth` + a shared `assertFounder(context)` helper (already in `social.functions.ts` — will extract).
- All mutations call `record_audit(actor, action, target_kind, target_id, before, after)` in the same transaction.
- Analytics uses SQL views + a couple of `SECURITY DEFINER` aggregate RPCs so we never ship service-role reads to the client.
- No changes to existing tables' RLS beyond additive columns; existing routes untouched.
- Preserve `/founder/*` routes as-is; `/studio` is additive. Old founder tiles cross-link into the new studio pages so nothing regresses.

## Deliverable for this turn

Phase 1 only: Studio shell + Studio Home + audit table + universal search + backend service scaffolding. Phases 2–4 ship in follow-up turns so each is reviewable and testable.

Confirm and I'll build Phase 1.
