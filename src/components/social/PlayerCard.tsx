import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PlayerAvatar } from "./PlayerAvatar";
import type { PlayerCard as P } from "@/lib/social.functions";

export function PlayerCard({ player, index = 0 }: { player: P; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.25 }}
    >
      <Link
        to="/players/$username"
        params={{ username: player.username }}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3 backdrop-blur transition active:scale-[0.99]"
      >
        <PlayerAvatar url={player.avatar_url} name={player.display_name} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{player.display_name}</p>
            {player.equipped_title && (
              <span
                className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                style={{ borderColor: `${player.equipped_title.color}55`, color: player.equipped_title.color }}
              >
                {player.equipped_title.name}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            @{player.username} • {player.city || "—"} • Lv {player.level}
          </p>
        </div>
        <div className="text-right">
          <p className="flex items-center gap-1 text-sm font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {player.total_xp.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">{player.quests_completed} quests</p>
        </div>
      </Link>
    </motion.div>
  );
}
