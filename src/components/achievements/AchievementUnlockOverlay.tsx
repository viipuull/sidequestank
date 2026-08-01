import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { RARITY_STYLES } from "@/lib/hooks/useTitles";
import type { UnlockedAchievement } from "@/lib/achievements.functions";

export function AchievementUnlockOverlay({
  achievements,
  onDismiss,
}: {
  achievements: UnlockedAchievement[];
  onDismiss: () => void;
}) {
  const first = achievements[0];
  useEffect(() => {
    if (!first) return;
    const epic = ["epic", "legendary", "mythic"].includes(first.rarity);
    confetti({
      particleCount: epic ? 260 : 140,
      spread: epic ? 130 : 90,
      origin: { y: 0.5 },
      colors: ["#a855f7", "#ec4899", "#f59e0b", "#22d3ee", "#a3e635"],
    });
    if (epic) {
      setTimeout(() => confetti({ particleCount: 140, spread: 150, origin: { y: 0.4 } }), 260);
      setTimeout(() => confetti({ particleCount: 100, spread: 160, origin: { y: 0.6 } }), 520);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first?.id]);

  if (!first) return null;
  const s = RARITY_STYLES[first.rarity] ?? RARITY_STYLES.common;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] grid place-items-center bg-background/85 p-6 backdrop-blur-md"
      >
        <motion.div
          key={first.id}
          initial={{ scale: 0.8, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 16, stiffness: 210 }}
          className={`card-shine relative w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl ${s.ring}`}
          style={{
            background: `linear-gradient(180deg, ${s.bg}, oklch(0.14 0.02 260))`,
            boxShadow: s.glow,
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: first.color ?? s.text }}
          >
            Achievement Unlocked · {s.label}
          </p>
          <motion.div
            initial={{ rotate: -8, scale: 0.6, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 12, stiffness: 200 }}
            className="badge-shimmer mx-auto mt-4 grid h-28 w-28 place-items-center rounded-3xl text-6xl"
            style={{ background: s.bg, boxShadow: s.glow }}
            aria-hidden
          >
            {first.badge_image_url ? (
              <img src={first.badge_image_url} alt="" className="h-24 w-24 object-contain" />
            ) : (
              first.icon
            )}
          </motion.div>
          <h2 className="mt-4 text-2xl font-bold">{first.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{first.description}</p>
          {achievements.length > 1 && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              +{achievements.length - 1} more unlocked. View them in Achievements.
            </p>
          )}
          <Button className="mt-5 w-full" onClick={onDismiss}>
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}