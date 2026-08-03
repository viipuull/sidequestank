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
  const track = variant === "onDark" ? "bg-black/30" : "bg-muted";

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
          className="font-semibold uppercase tracking-wider"
        >
          Level {level}
        </motion.span>
        <span className="font-semibold tabular-nums">{currentLevelXp} / {xpForNextLevel} XP</span>
      </div>
      <div
        className={`mt-1.5 w-full overflow-hidden rounded-full border border-white/10 ${track} ${compact ? "h-2" : "h-3"} ${pulse ? "ring-pulse" : ""}`}
      >
        <motion.div
          key={`${level}-${currentLevelXp}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1] }}
          className="card-shine h-full rounded-full"
          style={{
            background: variant === "onDark" ? "linear-gradient(90deg, oklch(1 0 0 / 0.95), oklch(0.95 0.06 68))" : "var(--gradient-xp)",
            boxShadow: variant === "onDark" ? "0 0 14px oklch(1 0 0 / 0.45)" : "0 0 14px var(--glow-primary)",
          }}
        />
      </div>
    </div>
  );
}
