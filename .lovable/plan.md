# Game-Feel Motion Pass

Goal: every scroll, tap, and screen change should feel like a polished game — snappy, physical, with subtle haptic-style feedback. No new features, no redesigns; purely a motion + micro-interaction layer on top of the existing UI.

## 1. Motion foundation (shared primitives)

Create `src/lib/motion.ts` with reusable Framer Motion presets so every screen uses the same "language":
- `springs.snappy`, `springs.soft`, `springs.bouncy` (tuned stiffness/damping)
- `variants.fadeUp`, `variants.popIn`, `variants.slideIn`, `variants.stagger`
- `tap.press` (scale 0.96 + subtle brightness), `tap.bounce` (scale 0.92 → 1.02 → 1)
- `hover.lift` (y:-2, shadow bump)

Add a tiny `useHaptic()` hook wrapping `navigator.vibrate` (10ms tick on tap, 30ms on success, pattern on level-up) — silently no-ops on unsupported devices.

## 2. Global button + card feedback

Extend `src/components/ui/button.tsx` and `Card`/`GlassCard`:
- Wrap in `motion.button` / `motion.div` with `whileTap={tap.press}`, `whileHover={hover.lift}`.
- Add `transition` using `springs.snappy`.
- Trigger `useHaptic().tick()` on press.
- Primary CTA variant gets a subtle glow pulse on mount.

This propagates game-feel to every existing screen without touching them individually.

## 3. Scroll-reveal system

Add `src/components/motion/Reveal.tsx` — an IntersectionObserver-based wrapper that fades + slides children in when they enter the viewport (once, with configurable delay/direction). Add `StaggerList` that staggers children by index.

Apply to the high-visibility feeds only (keep scope tight):
- Home rails (LiveOps, quick actions, stat tiles)
- Quest discovery cards (`/quests`)
- Achievements, Collections, Titles gallery grids
- Leaderboard rows
- Activity feed items

Rows stagger ~40ms apart with a soft spring. Respects `prefers-reduced-motion` (renders instantly).

## 4. Route transitions

In `src/routes/__root.tsx`, wrap `<Outlet />` in `AnimatePresence` keyed by pathname:
- Default: fade + 8px slide up, 220ms.
- Gameplay routes (`/quests/$slug/play`, celebrations): scale-in pop.
- Back navigation: mirror in reverse.

## 5. Bottom nav polish

`BottomNav.tsx`: active tab icon gets a spring scale + a small animated pill indicator that slides between tabs using `layoutId`. Tap = haptic tick + micro bounce.

## 6. Celebratory moments (amplify existing)

The Level-Up, Pioneer, Achievement, Collection, and Title overlays already exist — enhance rather than rebuild:
- Add screen shake (2-frame translate) on trigger.
- Add radial burst behind the badge (CSS conic gradient + scale/opacity).
- Longer haptic pattern.
- Confetti already present on quest completion — reuse the same util.

## 7. Number counters

Add `src/components/motion/CountUp.tsx` (spring-driven number tween). Use on:
- Home stat tiles (XP, level, quests done)
- Profile stats
- Studio dashboard tiles

## 8. Reduced motion + performance

- Every preset checks `useReducedMotion()`; when true, animations collapse to instant fades.
- Reveal uses IntersectionObserver with `rootMargin: 100px` and unobserves after first trigger — no scroll listeners.
- No layout thrash: only transform + opacity.

## Files touched (approx)

New: `src/lib/motion.ts`, `src/hooks/useHaptic.ts`, `src/components/motion/{Reveal,StaggerList,CountUp}.tsx`
Edited: `src/components/ui/{button,card,glass-card}.tsx`, `src/components/layout/BottomNav.tsx`, `src/routes/__root.tsx`, and the ~8 feed/gallery routes listed above to wrap lists in `StaggerList` / `Reveal`.

No database, RLS, or business-logic changes.

## Out of scope

- Redesigning any screen's layout or colors
- New gameplay/social/studio features
- Sound effects (can be a follow-up if you want audio too)

Want me to add lightweight sound effects (button click, success chime, level-up fanfare) as part of this pass, or keep it silent for now?
