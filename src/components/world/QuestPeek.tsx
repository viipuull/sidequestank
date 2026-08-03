import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Clock, Navigation, Sparkles, X } from "lucide-react";
import { formatDistance } from "@/lib/world/geo";
import type { WorldMarker } from "@/lib/world/types";

/** Bottom sheet that slides up when a marker is selected. */
export function QuestPeek({ marker, onClose }: { marker: WorldMarker; onClose: () => void }) {
  const { quest, state, distanceM } = marker;
  const unknown = state === "unknown";
  const locked = state === "locked";

  return (
    <motion.div
      initial={{ y: 140, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 140, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="absolute inset-x-2 bottom-2 z-[700] overflow-hidden rounded-3xl border border-border/60 bg-background/80 p-4 backdrop-blur-2xl"
      style={{ boxShadow: "0 20px 60px -20px oklch(0.1 0.02 285 / 0.9)" }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close quest preview"
        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-border/60 bg-card/70 text-muted-foreground transition-colors hover:text-foreground active:scale-90"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {unknown ? (
        <div className="pr-8">
          <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
            Unknown signal
          </div>
          <h3 className="mt-1 text-base font-bold tracking-tight">???</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Something is broadcasting from here. Move closer to decode it.
          </p>
          {distanceM != null && (
            <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary">
              <Navigation className="h-3 w-3" />
              {formatDistance(distanceM)} away
            </div>
          )}
        </div>
      ) : (
        <div className="pr-8">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-primary">
              {state === "completed" ? "Completed" : locked ? "Locked" : quest.category}
            </span>
            {quest.featured && <Sparkles className="h-3 w-3 text-amber-300" />}
          </div>
          <h3 className="mt-1 text-base font-bold leading-tight tracking-tight">{quest.title}</h3>
          {quest.short_description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{quest.short_description}</p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {quest.estimated_minutes} min
            </span>
            <span className="font-semibold text-primary">+{quest.reward_xp} XP</span>
            {distanceM != null && (
              <span className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {formatDistance(distanceM)}
              </span>
            )}
          </div>

          {!locked && (
            <Link
              to="/quests/$slug"
              params={{ slug: quest.slug }}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-2xl text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
              style={{ background: "var(--gradient-hero)" }}
            >
              {state === "completed" ? "View quest" : "Open quest"}
            </Link>
          )}
        </div>
      )}
    </motion.div>
  );
}
