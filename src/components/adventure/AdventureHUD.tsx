import { motion } from "framer-motion";
import { Compass, Timer, X, Zap } from "lucide-react";
import { formatDistance } from "@/lib/world/geo";
import type { Waypoint } from "@/lib/world/adventure";

type Props = {
  questTitle: string;
  difficulty?: string | null;
  estimatedMinutes?: number | null;
  rewardXp?: number | null;
  waypoints: Waypoint[];
  current: Waypoint | null;
  distanceM: number | null;
  bearingDelta: number | null;
  completed: number;
  total: number;
  arrived: boolean;
  onExit: () => void;
};

/** Cinematic in-run HUD: quest identity on top, live navigation on the bottom. */
export function AdventureHUD({
  questTitle,
  difficulty,
  estimatedMinutes,
  rewardXp,
  waypoints,
  current,
  distanceM,
  bearingDelta,
  completed,
  total,
  arrived,
  onExit,
}: Props) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        className="pointer-events-none absolute inset-x-0 top-0 z-[700] p-3"
      >
        <div className="pointer-events-auto flex items-start gap-2 rounded-2xl border border-border/60 bg-background/70 p-3 backdrop-blur-xl">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-primary">
              <Compass className="h-3 w-3" />
              Adventure mode
            </div>
            <h2 className="truncate text-sm font-bold">{questTitle}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
              {difficulty && <Chip>{difficulty}</Chip>}
              {estimatedMinutes ? (
                <Chip>
                  <Timer className="mr-1 inline h-2.5 w-2.5" />
                  {estimatedMinutes}m
                </Chip>
              ) : null}
              {rewardXp ? (
                <Chip>
                  <Zap className="mr-1 inline h-2.5 w-2.5" />
                  {rewardXp} XP
                </Chip>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit adventure mode"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border/60 bg-card/70 transition-transform active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-1.5 px-1">
          {waypoints.map((w) => (
            <div
              key={w.id}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                w.state === "done"
                  ? "bg-primary"
                  : w.state === "current"
                    ? "bg-primary/60"
                    : w.state === "pending"
                      ? "bg-amber-400/60"
                      : "bg-muted"
              }`}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[700] p-3"
      >
        <div className="rounded-2xl border border-border/60 bg-background/70 p-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10"
              aria-hidden
            >
              <motion.div
                animate={{ rotate: bearingDelta ?? 0 }}
                transition={{ type: "spring", stiffness: 90, damping: 16 }}
              >
                <Navigationish />
              </motion.div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {arrived ? "You've arrived" : current ? "Next checkpoint" : "Route complete"}
              </div>
              <div className="truncate text-sm font-semibold">
                {current ? current.title : "All checkpoints reached"}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-base font-bold tabular-nums text-primary">
                {distanceM == null ? "--" : formatDistance(distanceM)}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                {completed}/{total} done
              </div>
            </div>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border/60 bg-card/60 px-2 py-0.5 capitalize">{children}</span>
  );
}

function Navigationish() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-primary" aria-hidden>
      <path d="M12 2 4.5 20.3l.9.9L12 17.6l6.6 3.6.9-.9Z" />
    </svg>
  );
}