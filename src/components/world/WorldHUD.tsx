import { motion } from "framer-motion";
import { Crosshair, Navigation, Layers } from "lucide-react";
import { CompassRose } from "./CompassRose";
import { formatDistance } from "@/lib/world/geo";
import type { Atmosphere } from "@/lib/world/atmosphere";

type Props = {
  atmosphere: Atmosphere;
  heading: number | null;
  level: number | null;
  xpInLevel: number | null;
  xpForLevel: number | null;
  activeQuestTitle: string | null;
  distanceM: number | null;
  locating: boolean;
  onRecenter: () => void;
  questCount: number;
};

/** Lightweight exploration HUD floating over the world. */
export function WorldHUD({
  atmosphere,
  heading,
  level,
  xpInLevel,
  xpForLevel,
  activeQuestTitle,
  distanceM,
  locating,
  onRecenter,
  questCount,
}: Props) {
  const pct =
    xpInLevel != null && xpForLevel ? Math.max(0, Math.min(100, (xpInLevel / xpForLevel) * 100)) : 0;

  return (
    <>
      {/* top-left: compass + world state */}
      <div className="pointer-events-none absolute left-3 top-3 z-[600] flex items-start gap-2">
        <div className="pointer-events-auto">
          <CompassRose heading={heading ?? 0} live={heading != null} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-background/55 px-3 py-2 backdrop-blur-xl"
        >
          <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {atmosphere.label} · Ankleshwar
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold">
            <Layers className="h-3 w-3 text-primary" />
            {questCount} signal{questCount === 1 ? "" : "s"}
          </div>
        </motion.div>
      </div>

      {/* top-right: level + xp */}
      {level != null && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute right-3 top-3 z-[600] w-32 rounded-2xl border border-border/60 bg-background/55 px-3 py-2 backdrop-blur-xl"
        >
          <div className="flex items-baseline justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Level
            </span>
            <span className="text-sm font-bold text-primary">{level}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--gradient-hero)" }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
            />
          </div>
          {xpInLevel != null && xpForLevel != null && (
            <div className="mt-1 text-right text-[9px] tabular-nums text-muted-foreground">
              {xpInLevel}/{xpForLevel} XP
            </div>
          )}
        </motion.div>
      )}

      {/* bottom-left: active target */}
      {activeQuestTitle && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-none absolute bottom-3 left-3 z-[600] max-w-[58%] rounded-2xl border border-primary/35 bg-background/60 px-3 py-2 backdrop-blur-xl"
        >
          <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-primary">
            Active target
          </div>
          <div className="truncate text-[12px] font-semibold">{activeQuestTitle}</div>
          {distanceM != null && (
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Navigation className="h-3 w-3" />
              {formatDistance(distanceM)} away
            </div>
          )}
        </motion.div>
      )}

      {/* bottom-right: recenter */}
      <motion.button
        type="button"
        onClick={onRecenter}
        whileTap={{ scale: 0.9 }}
        aria-label="Center map on my location"
        className="absolute bottom-3 right-3 z-[600] grid h-11 w-11 place-items-center rounded-full border border-border/60 bg-background/60 text-primary backdrop-blur-xl transition-colors hover:border-primary/50"
      >
        <Crosshair className={`h-5 w-5 ${locating ? "animate-pulse" : ""}`} />
      </motion.button>
    </>
  );
}
