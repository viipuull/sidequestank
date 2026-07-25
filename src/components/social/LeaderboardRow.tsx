import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { RankBadge } from "./RankBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import type { LeaderboardEntry } from "@/lib/leaderboards.functions";

export function LeaderboardRow({ entry, highlight, index = 0 }: { entry: LeaderboardEntry; highlight?: boolean; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.25), duration: 0.22 }}
    >
      <Link
        to="/players/$username"
        params={{ username: entry.profile.username }}
        className={`flex items-center gap-3 rounded-2xl border p-3 transition active:scale-[0.99] ${
          highlight ? "border-primary/60 bg-primary/10" : "border-border bg-card/60"
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
        <p className="text-sm font-bold text-primary">{entry.xp.toLocaleString()}</p>
      </Link>
    </motion.div>
  );
}
