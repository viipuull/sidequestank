import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CountUp } from "@/components/motion/CountUp";
import { RankBadge } from "./RankBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import type { LeaderboardEntry } from "@/lib/leaderboards.functions";

export function LeaderboardRow({ entry, highlight, index = 0 }: { entry: LeaderboardEntry; highlight?: boolean; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ delay: Math.min(index * 0.03, 0.35), duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
      whileHover={{ x: 3 }}
    >
      <Link
        to="/players/$username"
        params={{ username: entry.profile.username }}
        className={`hud-panel flex items-center gap-3 rounded-2xl p-3 transition-all duration-200 hover:border-primary/45 active:scale-[0.99] ${
          highlight ? "card-shine neon-primary border-primary/60 bg-primary/10" : ""
        }`}
      >
        <RankBadge rank={entry.rank} />
        <PlayerAvatar url={entry.profile.avatar_url} name={entry.profile.display_name} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{entry.profile.display_name}</p>
            {entry.equipped_title && (
              <span className="rounded-full border px-1.5 py-0.5 text-[10px]" style={{ borderColor: `${entry.equipped_title.color}55`, color: entry.equipped_title.color }}>
                {entry.equipped_title.name}
              </span>
            )}
          </div>
          <p className="truncate text-[11px] text-muted-foreground">Lv {entry.level} • {entry.quests_completed} quests</p>
        </div>
        <div className="flex flex-col items-end">
          <CountUp value={entry.xp} className="text-sm font-bold tabular-nums text-primary" />
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">XP</span>
        </div>
      </Link>
    </motion.div>
  );
}
