import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps any success surface (saved / published / verified / approved) with a
 * one-shot glow ring + sparkle burst. Purely decorative.
 *
 * Sound-ready: pass `onPeak` to hook a future SFX trigger at the burst frame.
 */
export function SuccessPulse({
  active,
  children,
  className = "",
  tone = "primary",
  onPeak,
}: {
  active: boolean;
  children?: ReactNode;
  className?: string;
  tone?: "primary" | "gold" | "cyan";
  onPeak?: () => void;
}) {
  const reduce = useReducedMotion();
  const color =
    tone === "gold"
      ? "oklch(0.83 0.17 85 / 0.55)"
      : tone === "cyan"
        ? "oklch(0.78 0.14 205 / 0.55)"
        : "oklch(0.62 0.22 295 / 0.55)";

  return (
    <span className={`relative inline-flex ${className}`}>
      {children}
      <AnimatePresence>
        {active && !reduce && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            initial={{ opacity: 0.9, scale: 0.85 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            onAnimationStart={onPeak}
            transition={{ duration: 0.62, ease: [0.2, 0.7, 0.2, 1] }}
            style={{ boxShadow: `0 0 0 3px ${color}, 0 0 34px ${color}` }}
          />
        )}
      </AnimatePresence>
    </span>
  );
}