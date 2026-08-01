# SideQuest — Game Feel & Immersion Pass

Goal: make every screen feel alive and cinematic without hurting usability or performance. The project already has the raw pieces (`src/lib/motion.ts`, `Reveal`, `StaggerList`, `PageTransition`, `CountUp`, `useHaptic`), but most screens don't use them. This pass turns those pieces into a consistent, applied motion language.

## 1. Motion foundation (tokens + utilities)

- Extend `src/styles.css` with immersion tokens and keyframes: `shine-sweep`, `shimmer`, `aurora-drift`, `breathe`, `ring-pulse`, plus `--ease-premium` and duration tokens. All colors stay on existing oklch tokens (purple primary / gold accent).
- Add utility classes: `.card-shine`, `.badge-shimmer`, `.title-glow`, `.ambient-layer`, `.skeleton-shimmer`.
- Every animation wrapped in `@media (prefers-reduced-motion: reduce)` off-switches.
- Expand `src/lib/motion.ts` with shared variants: `fadeBlurUp`, `heroReveal`, `listStagger`, `cardHover`, `pressTap`, and standard durations so nothing is hand-tuned per file.

## 2. Ambient live background

- New `src/components/motion/AmbientBackground.tsx`: two very slow drifting radial gradient blobs (purple + gold, low opacity) plus faint noise overlay, GPU-only transforms, `pointer-events-none`, fixed behind content.
- Mounted once in `AppShell` (and the auth/onboarding `ScreenShell`) so the world always breathes. Disabled under reduced motion.

## 3. Page transitions

- Upgrade `PageTransition` to fade + 8px rise + slight blur-out on exit, using the premium easing, ~220ms in / 140ms out. Keeps existing route-key logic and reduced-motion bypass.

## 4. Scroll choreography

Apply `Reveal` / `StaggerList` (once-only, IntersectionObserver based) to the main content sections of:
- `/home` (stat tiles, quick links, rails, prizes card)
- `/quests` (card grid)
- `/leaderboard` (rows)
- `/collections`, `/achievements`, `/titles` (galleries)
- `/players/$username`, `/profile`

All numeric stats (XP, level, rank, streaks, counts) switch to `CountUp`.

## 5. Interaction feel

- `QuestCard`: becomes a collectible-card component — hover lift + 1.02 scale + border glow, subtle pointer-based tilt on devices with a fine pointer, occasional slow shine sweep, image parallax/zoom, press-scale + haptic tick on tap.
- Buttons (`src/components/ui/button.tsx`): unified press spring, soft glow on primary, smooth color transition; keep all variants/API unchanged.
- Icons in nav and action rows: gentle spring bounce/rotate on activation.
- Bottom nav: keep `layoutId` pill, add glow ring and springier morph.

## 6. Reward moments

- Level up: ring pulse + glow burst around the XP bar (`XpBar` gets an `onLevelUp` pulse state).
- XP earned: count-up plus a floating "+XP" chip.
- Achievement / title unlock overlays: add a shine sweep across the badge on top of existing confetti.
- Quest completion: confetti (already present) plus a light sweep across the completion card.
- Badges shimmer on a slow ~25s loop; titles get a soft glow.
- Success toasts for Saved / Published / Uploaded / Verified / Claimed get a check-draw animation.

## 7. Loading states

- New `src/components/feedback/Skeletons.tsx` with shimmering skeletons for quest cards, leaderboard rows, stat tiles, and profile headers.
- Replace bare `LoadingScreen` spinners on `/home`, `/quests`, `/leaderboard`, `/collections`, `/profile`, and Studio list pages with matching skeletons that cross-fade into loaded content. `LoadingScreen` stays for full-route auth gating only.

## 8. Studio (admin)

Lighter touch: page transitions, list stagger, table row hover, button press feedback, and skeletons — no ambient background, so the admin stays fast and utilitarian.

## Technical notes

- All motion via Framer Motion transforms/opacity only (no layout thrash); ambient layers use `will-change: transform` and long durations to stay at 60 FPS.
- Every animated component respects `useReducedMotion()` / the CSS media query.
- No business logic, data fetching, RLS, or schema changes — presentation layer only.
- Verification: typecheck plus a Playwright pass on `/`, `/home`, `/quests`, `/leaderboard`, `/profile` at 360px to confirm no console errors, no layout shift, and content visible after reveals.
