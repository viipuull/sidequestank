import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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

  // Pulse the bar whenever the player gains a level.
  const prevLevel = useRef(level);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (level > prevLevel.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 2800);
      prevLevel.current = level;
      return () => clearTimeout(t);
    }
    prevLevel.current = level;
  }, [level]);

  return (
    <div className={className}>
      <div className={`flex items-center justify-between text-[11px] ${label}`}>
        <motion.span
          key={level}
          initial={{ scale: 1 }}
          animate={pulse ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={{ duration: 0.6 }}
          className="font-semibold"
        >
          Level {level}
        </motion.span>
        <span>{currentLevelXp} / {xpForNextLevel} XP</span>
      </div>
      <div
        className={`mt-1 w-full overflow-hidden rounded-full ${track} ${compact ? "h-1.5" : "h-2"} ${pulse ? "ring-pulse" : ""}`}
      >
        <motion.div
          key={`${level}-${currentLevelXp}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1] }}
          className={`card-shine h-full rounded-full ${fill}`}
        />
      </div>
    </div>
  );
}
