import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { RARITY_STYLES } from "@/lib/hooks/useTitles";

export type UnlockedTitle = {
  id: string; slug: string; name: string; description: string;
  rarity: string; category: string; icon: string; color: string;
};

export function TitleUnlockOverlay({
  titles, onDismiss,
}: {
  titles: UnlockedTitle[];
  onDismiss: () => void;
}) {
  const first = titles[0];
  useEffect(() => {
    if (!first) return;
    const epic = ["epic", "legendary", "mythic"].includes(first.rarity);
    confetti({
      particleCount: epic ? 220 : 120,
      spread: epic ? 120 : 80,
      origin: { y: 0.5 },
      colors: ["#a855f7", "#ec4899", "#f59e0b", "#22d3ee"],
    });
    if (epic) setTimeout(() => confetti({ particleCount: 120, spread: 140, origin: { y: 0.4 } }), 250);
  }, [first?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!first) return null;
  const s = RARITY_STYLES[first.rarity] ?? RARITY_STYLES.common;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] grid place-items-center bg-background/85 p-6 backdrop-blur-md"
      >
        <motion.div
          key={first.id}
          initial={{ scale: 0.85, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 220 }}
          className={`w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl ${s.ring}`}
          style={{ background: `linear-gradient(180deg, ${s.bg}, oklch(0.14 0.02 260))`, boxShadow: s.glow }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: first.color ?? s.text }}>
            Title Unlocked · {s.label}
          </p>
          <motion.div
            initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, delay: 0.1 }}
            className="mx-auto mt-3 grid h-24 w-24 place-items-center rounded-full border text-5xl"
            style={{ borderColor: first.color ?? s.text, boxShadow: s.glow, background: s.bg }}
          >
            {first.icon}
          </motion.div>
          <h2 className="mt-4 text-2xl font-black tracking-tight" style={{ color: first.color ?? s.text }}>
            {first.name}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{first.description}</p>
          {titles.length > 1 && (
            <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
              +{titles.length - 1} more title{titles.length > 2 ? "s" : ""} to reveal
            </p>
          )}
          <Button className="mt-6 h-12 w-full rounded-2xl text-sm font-bold" onClick={onDismiss}>
            {titles.length > 1 ? "Next" : "Awesome"}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
