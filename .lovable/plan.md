# SideQuest — Production Stabilization Plan

This is a massive scope (auth, gameplay, progression, social, LiveOps, Studio, DB, security, a11y, perf, docs). Landing it in one turn would be reckless — hundreds of files could churn without you being able to verify each area. I'll break it into **6 focused phases**, each shippable and reviewable on its own. You approve the plan, then say "continue phase N" between phases.

No new gameplay systems will be added — only fixes, hardening, and polish on what exists.

## Phase 1 — Foundations: Errors, Loading, Routing, 404/500
- Global `errorComponent` + `notFoundComponent` on root route with retry + home actions.
- Consistent `LoadingScreen`, `EmptyState`, `ErrorState` primitives; adopt across routes that currently render blank/`null` during loads.
- Fix known route edges: back-button on gameplay, resume-quest race, tutorial→home transition, deep-link redirects preserving `redirect` param.
- Route audit: verify every `createFileRoute` path matches filename; kill dead routes.

## Phase 2 — Data Layer: RLS, Indexes, Constraints, Storage
- Audit every table's RLS (run linter). Tighten `anon` grants; ensure `service_role` grants everywhere edge/admin touches.
- Add missing indexes: `quest_sessions(user_id,status)`, `xp_events(user_id,created_at desc)`, `notifications(user_id,read_at)`, `player_collections(user_id)`, `activity_events(user_id,created_at desc)`, `leaderboard_snapshots(scope,scope_key,period,period_key,rank)`.
- Storage: verify `quest-media` policies (founder write, public read of published), add `avatars` bucket if missing with per-user path policies, size/type validation client-side.
- Foreign keys / ON DELETE review to prevent orphans.

## Phase 3 — Gameplay & Progression Reliability
- Start/Resume quest: idempotent session creation, resume from last incomplete objective.
- Objective verifiers: GPS (timeout, permission-denied UX), QR (camera fallback, torch), Photo (camera-only vs gallery config honored, size limit, HEIC handling), Trivia (single-answer lock).
- XP/Level: guard against double-award (already partially handled via `xp_events` unique-ish check — verify), level-up overlay dedupe.
- Achievement/Title/Collection evaluators called after every completion path; consolidate into one post-completion hook.

## Phase 4 — Performance & Rendering
- React Query defaults: `staleTime`, `gcTime`, retry policy per query family.
- Route-level code splitting review (Studio, Founder, gameplay in separate chunks).
- Image handling: `loading="lazy"`, `decoding="async"`, `aspect-*` wrappers, `object-cover`.
- Memoize heavy lists (leaderboard, discovery); virtualize if >100 items.
- Framer Motion: respect `prefers-reduced-motion`, drop layout animations from long lists.

## Phase 5 — UX Polish, Accessibility, Responsive
- A11y sweep: icon-only buttons get `aria-label`, single `<main>` per route, focus rings, `h-dvh` for full-height, form labels.
- Toast system consistency (success/error/info) — one provider, one API.
- Empty states with clear CTAs on all list screens.
- Responsive audit at 360/414/768/1280; fix overflows, tap targets ≥44px.
- Reduced-motion + high-contrast fallback tokens.

## Phase 6 — Security, SEO, Docs, Launch Prep
- Founder-only server functions: verify role check inside handler (not just RLS).
- Input validation via Zod on every `createServerFn` `.inputValidator`.
- Per-route `head()` meta on every public route (unique title/desc/og).
- `robots.txt`, sitemap, canonical.
- `docs/` folder: ARCHITECTURE.md, DATABASE.md, ROLES.md, DEPLOYMENT.md, RUNBOOK.md.
- Run security scanner + linter; resolve or document findings.

## Technical notes
- Each phase ends with: build check, linter, targeted Playwright smoke on 2–3 critical flows (auth, start quest, complete quest → XP).
- Migrations only in Phase 2 and Phase 6 (indexes, then any policy tightening).
- No breaking API changes to existing server functions — signatures stable.

## What I need from you
1. Approve this phased approach (vs one giant turn).
2. Confirm priority order — default is 1→6, but if you want (e.g.) security first, say so.
3. Any specific bugs you've already noticed I should treat as P0 in Phase 1?
