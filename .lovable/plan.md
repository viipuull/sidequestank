# Founder Studio – Final Completion Sprint

This is a very large scope (15 workstreams). To ship it reliably without breaking existing player/founder flows, I'll execute it in **6 sequential phases**, each self-contained, tested, and shippable. After each phase I'll pause briefly so you can sanity-check before I move on.

If you'd rather I run straight through all 6 phases without pausing, say "run all phases".

---

## Phase 1 — Player Management (Section 1)

**Backend (migration)**
- Add `profiles.suspended_at`, `profiles.suspended_reason`.
- SECURITY DEFINER RPCs (founder-only, all call `record_audit`):
  `admin_suspend_player`, `admin_restore_player`, `admin_set_profile_hidden`,
  `admin_grant_xp(_user, _amount, _reason)`, `admin_remove_xp`,
  `admin_grant_title`, `admin_revoke_title`,
  `admin_grant_achievement`, `admin_revoke_achievement`,
  `admin_reset_quest_session(_session_id)`, `admin_reset_event_progress(_user, _event)`.
- Gate authenticated access to suspended users in `AuthGate` (soft block screen).

**Studio UI** — `src/routes/studio.players.index.tsx`, `studio.players.$userId.tsx`
- Search + filter (city, level range, suspended, hidden, pioneer, founder).
- Player detail: progression, XP, titles, achievements, collections, quest history, event progress, recent logins (from `auth.users.last_sign_in_at` via admin RPC).
- Action rail with confirmation dialogs; each action toasts + refetches.

## Phase 2 — Notifications, Announcements, Role Manager (Sections 2, 4)

**Backend**
- `admin_broadcast_notification(_audience jsonb, _kind, _title, _body, _icon, _deep_link, _priority, _metadata, _scheduled_at)` — fan-out to matching users; if `_scheduled_at` future, insert into new `scheduled_notifications` table processed by liveops tick.
- `admin_create_announcement(...)` + edit/delete RPCs (already have table).
- `admin_grant_role(_user, _role)`, `admin_revoke_role` — cannot remove self as founder.

**UI**
- `studio.notifications.tsx`: composer (audience picker, preview, send/schedule), history table with delivery counts, unread aggregate.
- `studio.announcements.tsx`: CRUD list.
- `studio.roles.tsx`: founder list, grant/revoke with confirm.

## Phase 3 — Analytics + Audit Log v2 (Sections 3, 5)

**Backend**
- Read-only aggregate RPCs: `analytics_overview(_from, _to)` returning DAU/WAU/MAU, new/returning, quest funnel, XP totals, top/bottom quests, collection completion, achievements/titles earned, leaderboard growth, event participation, notification delivery.
- Audit list RPC with search/filter/pagination.

**UI**
- `studio.analytics.tsx`: KPI tiles + Recharts line/bar (7/30/90/custom range, refresh, PNG export via html-to-image).
- `studio.audit.tsx`: search, filter (action, actor email, target kind, date range), pagination, CSV export.

## Phase 4 — LiveOps polish + Content bulk actions (Sections 6, 7)

- LiveOps event editor: pause/resume/visibility, banner+cover via MediaField, scheduled publish/end, timezone helper, countdown preview.
- Add duplicate/archive/restore/delete/(un)publish + bulk actions to Quests, Collections, Achievements, Titles, Events list pages. Confirmation dialogs, toasts, undo where safe.

## Phase 5 — Editor safety, search, import/export (Sections 8, 9, 10, 11)

- `useUnsavedChanges` hook: TanStack Router `blocker` + `beforeunload`. Wire into all editors.
- Concurrent-edit detection: compare `updated_at` on save; conflict dialog (Reload / Overwrite / Cancel).
- Extend `StudioCommandPalette` to search Players, Media, Announcements, Audit alongside existing content.
- Import/Export: per-entity JSON export button; JSON import with Zod validation + dry-run preview.

## Phase 6 — A11y / performance / security / QA (Sections 12–15)

- A11y pass on new Studio surfaces: ARIA labels, focus trap in dialogs, keyboard nav on tables, 44px targets, contrast.
- Perf: query keys + `staleTime` review, paginate players/audit/notifications, lazy-load charts, image `loading="lazy"`.
- Security: run `supabase--linter`, verify every new RPC has `is_founder()` check and `record_audit`, confirm RLS unchanged on player tables.
- Internal QA sweep with Playwright across all Studio routes; fix any regressions.
- Final report with production-readiness score.

---

## Technical notes

- All privileged mutations go through SECURITY DEFINER RPCs guarded by `is_founder()` and call `record_audit(...)`; no service-role client on client paths.
- No changes to auto-generated Supabase files.
- No changes to player-facing routes beyond the suspended-user soft block.
- Recharts and html-to-image are the only new deps (both worker-safe / client-only).
- Migrations grouped one per phase to keep review small.

**Ready to start Phase 1 on approval.**