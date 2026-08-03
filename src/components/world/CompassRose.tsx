import { motion, useReducedMotion } from "framer-motion";

/**
 * Animated compass. Follows the device heading when available and keeps a
 * gentle sway otherwise, so it never reads as a static icon.
 */
export function CompassRose({ heading = 0, live = false }: { heading?: number; live?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative grid h-11 w-11 place-items-center rounded-full border border-border/60 bg-background/55 backdrop-blur-xl">
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, oklch(0.68 0.19 285 / 0.22), transparent 70%)" }}
      />
      <motion.div
        className="relative h-8 w-8"
        animate={
          reduce
            ? { rotate: -heading }
            : live
              ? { rotate: -heading }
              : { rotate: [-2, 2, -2] }
        }
        transition={
          live || reduce
            ? { type: "spring", stiffness: 90, damping: 16 }
            : { duration: 9, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <svg viewBox="0 0 32 32" className="h-full w-full">
          <circle cx="16" cy="16" r="14" fill="none" stroke="oklch(1 0 0 / 0.14)" strokeWidth="1" />
          <circle cx="16" cy="16" r="10.5" fill="none" stroke="oklch(1 0 0 / 0.07)" strokeWidth="0.75" />
          <polygon points="16,4 19,15 16,13 13,15" fill="oklch(0.72 0.2 20)" />
          <polygon points="16,28 13,17 16,19 19,17" fill="oklch(0.85 0.02 285 / 0.75)" />
          <circle cx="16" cy="16" r="1.6" fill="oklch(0.95 0 0)" />
        </svg>
      </motion.div>
      <span className="pointer-events-none absolute -bottom-1 text-[7px] font-bold tracking-[0.2em] text-muted-foreground">
        N
      </span>
    </div>
  );
}
