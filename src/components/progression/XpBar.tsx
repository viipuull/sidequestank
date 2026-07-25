import { motion } from "framer-motion";

type Props = {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  compact?: boolean;
  className?: string;
  variant?: "onDark" | "onLight";
};

export function XpBar({ level, currentLevelXp, xpForNextLevel, compact, className, variant = "onDark" }: Props) {
  const denom = Math.max(1, xpForNextLevel);
  const pct = Math.max(0, Math.min(100, (currentLevelXp / denom) * 100));
  const label = variant === "onDark" ? "text-primary-foreground/90" : "text-muted-foreground";
  const track = variant === "onDark" ? "bg-white/20" : "bg-muted";
  const fill = variant === "onDark" ? "bg-white/90" : "bg-primary";
  return (
    <div className={className}>
      <div className={`flex items-center justify-between text-[11px] ${label}`}>
        <span className="font-semibold">Level {level}</span>
        <span>{currentLevelXp} / {xpForNextLevel} XP</span>
      </div>
      <div className={`mt-1 w-full overflow-hidden rounded-full ${track} ${compact ? "h-1.5" : "h-2"}`}>
        <motion.div
          key={`${level}-${currentLevelXp}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className={`h-full rounded-full ${fill}`}
        />
      </div>
    </div>
  );
}
