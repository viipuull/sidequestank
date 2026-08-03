import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { Atmosphere } from "@/lib/world/atmosphere";
import type { WorldLayerFlags } from "@/lib/world/config";
import { TIER_BUDGET, type PerfTier } from "@/lib/world/perf";

type Props = {
  atmosphere: Atmosphere;
  layers: WorldLayerFlags;
  tier: PerfTier;
  /** Small pixel offset from map movement, drives the parallax. */
  parallax: { x: number; y: number };
};

/**
 * Everything that makes the world feel alive but is never interactive:
 * fog, grid, light rays, particles, birds, stars. Pointer-events: none
 * throughout, aria-hidden throughout, and each layer is individually
 * gated by device tier + reduced motion.
 */
export function AmbientLayer({ atmosphere, layers, tier, parallax }: Props) {
  const reduce = useReducedMotion();
  const budget = TIER_BUDGET[tier];
  const [late, setLate] = useState(false);

  // Defer the expensive decorative layers until after first paint.
  useEffect(() => {
    if (reduce || tier === "low") return;
    const id = window.setTimeout(() => setLate(true), 900);
    return () => window.clearTimeout(id);
  }, [reduce, tier]);

  const motes = useMemo(
    () =>
      Array.from({ length: budget.particles }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${(i * 61) % 100}%`,
        delay: `${(i % 9) * 0.9}s`,
        dur: `${9 + (i % 6) * 2.2}s`,
        size: 1 + (i % 3),
      })),
    [budget.particles],
  );

  const stars = useMemo(
    () =>
      atmosphere.stars
        ? Array.from({ length: tier === "high" ? 34 : 16 }, (_, i) => ({
            left: `${(i * 53) % 100}%`,
            top: `${(i * 29) % 55}%`,
            delay: `${(i % 7) * 0.7}s`,
            size: i % 5 === 0 ? 2 : 1,
          }))
        : [],
    [atmosphere.stars, tier],
  );

  const px = layers.parallax && !reduce ? parallax.x : 0;
  const py = layers.parallax && !reduce ? parallax.y : 0;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[450] overflow-hidden">
      {/* time-of-day wash */}
      <div className="absolute inset-0 transition-[background] duration-1000" style={{ background: atmosphere.wash }} />

      {/* night sky */}
      {atmosphere.stars && (
        <>
          <div
            className="absolute right-6 top-6 h-14 w-14 rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 35%, oklch(0.96 0.03 90), oklch(0.82 0.05 90))",
              boxShadow: "0 0 60px 18px oklch(0.9 0.05 90 / 0.22)",
              transform: `translate3d(${px * 1.4}px, ${py * 1.4}px, 0)`,
            }}
          />
          {stars.map((s, i) => (
            <span
              key={i}
              className="sq-star absolute rounded-full bg-white"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
                transform: `translate3d(${px * 1.8}px, ${py * 1.8}px, 0)`,
              }}
            />
          ))}
        </>
      )}

      {/* explorer grid */}
      {layers.grid && (
        <div
          className="absolute inset-[-10%] opacity-[0.13]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.75 0.1 285 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(0.75 0.1 285 / 0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(70% 60% at 50% 50%, #000 30%, transparent 85%)",
            transform: `translate3d(${px * 0.6}px, ${py * 0.6}px, 0)`,
          }}
        />
      )}

      {/* drifting fog */}
      {layers.fog && budget.fog && !reduce && (
        <>
          <div className="sq-fog sq-fog--a absolute inset-x-[-25%] top-[8%] h-40" />
          <div className="sq-fog sq-fog--b absolute inset-x-[-25%] bottom-[14%] h-52" />
        </>
      )}

      {/* light rays */}
      {layers.rays && budget.rays && late && (
        <div
          className="sq-rays absolute inset-0"
          style={{ ["--sq-ray" as string]: atmosphere.glow }}
        />
      )}

      {/* floating motes */}
      {layers.particles && late && !reduce && (
        <div className="absolute inset-0">
          {motes.map((m, i) => (
            <span
              key={i}
              className="sq-mote absolute rounded-full"
              style={{
                left: m.left,
                top: m.top,
                width: m.size,
                height: m.size,
                background: atmosphere.glow,
                animationDelay: m.delay,
                animationDuration: m.dur,
              }}
            />
          ))}
        </div>
      )}

      {/* rare bird flight */}
      {layers.birds && budget.birds && late && !reduce && <Birds />}

      {/* grounding vignette — keeps the HUD readable over bright tiles */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 85% at 50% 45%, transparent 45%, oklch(0.12 0.02 285 / 0.55) 100%)",
        }}
      />
    </div>
  );
}

/** Two silhouettes that cross the sky every ~40s. Cheap, rare, atmospheric. */
function Birds() {
  return (
    <div className="sq-birds absolute left-0 top-[18%] flex gap-3 opacity-60">
      <BirdGlyph className="sq-bird-a" />
      <BirdGlyph className="sq-bird-b" />
      <BirdGlyph className="sq-bird-c" />
    </div>
  );
}

function BirdGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 10" className={`h-2.5 w-6 ${className ?? ""}`} fill="none">
      <path
        d="M1 8c4 0 6-6 10-6s6 6 10 6"
        stroke="oklch(0.85 0.02 285 / 0.8)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
