import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Very slow drifting aurora blobs behind the app content.
 * Purely decorative: pointer-events none, GPU transforms only.
 */
export function AmbientBackground({ intensity = 1 }: { intensity?: number }) {
  const reduce = useReducedMotion();
  // Dust motes are decorative and only mount after hydration + idle, so the
  // first paint stays cheap and SSR output is deterministic.
  const [showDust, setShowDust] = useState(false);
  useEffect(() => {
    if (reduce) return;
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 420px)").matches) return;
    const id = window.setTimeout(() => setShowDust(true), 900);
    return () => window.clearTimeout(id);
  }, [reduce]);

  const motes = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${(i * 61) % 100}%`,
        size: 2 + ((i * 7) % 3),
        delay: (i % 7) * 0.9,
        duration: 9 + ((i * 3) % 7),
      })),
    [],
  );

  return (
    <div aria-hidden className="vignette pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 60% at 50% -10%, oklch(0.3 0.12 295 / 0.35), transparent 70%)",
        }}
      />
      <motion.div
        className="absolute -left-1/4 top-[-10%] h-[70vh] w-[70vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.62 0.22 295 / 0.22), transparent 65%)",
          filter: "blur(40px)",
          opacity: 0.9 * intensity,
          willChange: "transform",
        }}
        animate={reduce ? undefined : { x: ["-4%", "8%", "-4%"], y: ["-3%", "5%", "-3%"], scale: [1, 1.12, 1] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-1/4 bottom-[-15%] h-[60vh] w-[60vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.83 0.17 85 / 0.14), transparent 65%)",
          filter: "blur(50px)",
          opacity: 0.9 * intensity,
          willChange: "transform",
        }}
        animate={reduce ? undefined : { x: ["5%", "-7%", "5%"], y: ["6%", "-4%", "6%"], scale: [1.08, 0.95, 1.08] }}
        transition={{ duration: 42, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Teal aurora in the upper-right, matching the cinematic dashboard look. */}
      <motion.div
        className="absolute right-[-15%] top-[-20%] h-[65vh] w-[65vh] rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.7 0.13 195 / 0.20), transparent 66%)",
          filter: "blur(60px)",
          opacity: 0.9 * intensity,
          willChange: "transform",
        }}
        animate={reduce ? undefined : { x: ["3%", "-6%", "3%"], y: ["-2%", "6%", "-2%"], scale: [1, 1.1, 1] }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Slow cyan light beam sweeping the upper third. */}
      <motion.div
        className="absolute -top-1/3 left-0 h-[120vh] w-[45vw] origin-top"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.78 0.14 205 / 0.10), transparent)",
          filter: "blur(30px)",
          rotate: 12,
          willChange: "transform, opacity",
        }}
        animate={reduce ? undefined : { x: ["-20%", "120%"], opacity: [0, 0.9, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Glowing dust motes — desktop/tablet only, mounted lazily. */}
      {showDust &&
        motes.map((m, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: m.left,
              top: m.top,
              height: m.size,
              width: m.size,
              background: "oklch(0.9 0.06 205 / 0.55)",
              boxShadow: "0 0 8px oklch(0.78 0.14 205 / 0.5)",
              willChange: "transform, opacity",
            }}
            animate={{ y: [0, -26, 0], opacity: [0, 0.6, 0] }}
            transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
    </div>
  );
}