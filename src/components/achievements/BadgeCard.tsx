import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { RARITY_STYLES } from "@/lib/hooks/useTitles";
import type { AchievementRow, PlayerAchievementRow } from "@/lib/achievements.functions";

export function BadgeCard({
  achievement,
  progress,
  clickable = true,
}: {
  achievement: AchievementRow;
  progress: PlayerAchievementRow | null | undefined;
  clickable?: boolean;
}) {
  const completed = !!progress?.completed;
  const isSecretHidden = achievement.secret && !completed;
  const isHiddenLocked = achievement.hidden && !completed;
  const style = RARITY_STYLES[achievement.rarity] ?? RARITY_STYLES.common;
  const pct = Math.min(
    100,
    Math.round(((progress?.progress ?? 0) / Math.max(1, progress?.target ?? achievement.goal_target)) * 100),
  );
  const displayName = isSecretHidden ? "???" : achievement.name;
  const displayDesc = isSecretHidden
    ? "Secret achievement — unlock to reveal."
    : achievement.description;
  const icon = isSecretHidden ? "❔" : achievement.icon;

  const inner = (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur transition ${style.ring} ${
        completed ? "" : "opacity-90"
      }`}
      style={{
        background: completed
          ? `linear-gradient(180deg, ${style.bg}, oklch(0.14 0.02 260))`
          : "oklch(0.16 0.02 260 / 0.6)",
        boxShadow: completed ? style.glow : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl ${
            completed ? "" : "grayscale"
          }`}
          style={{ background: style.bg }}
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            {!completed && !isSecretHidden && (
              <Lock className="h-3 w-3 text-muted-foreground" aria-hidden />
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{displayDesc}</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${style.ring}`}
              style={{ color: style.text, background: style.bg }}
            >
              {style.label}
            </span>
            {progress?.featured && (
              <span className="text-[9px] font-semibold uppercase tracking-widest text-primary">Pinned</span>
            )}
          </div>
          {!isSecretHidden && !isHiddenLocked && (progress?.target ?? achievement.goal_target) > 1 && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: style.text }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {progress?.progress ?? 0} / {progress?.target ?? achievement.goal_target}
              </p>
            </div>
          )}
        </div>
      </div>
      {completed && (
        <span className="absolute right-2 top-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
          Unlocked
        </span>
      )}
    </motion.div>
  );

  if (!clickable || isSecretHidden) return inner;
  return (
    <Link to="/achievements/$slug" params={{ slug: achievement.slug }} className="block">
      {inner}
    </Link>
  );
}