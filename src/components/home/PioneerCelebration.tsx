import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_PREFIX = "sq_pioneer_celebrated_v1:";

function fireConfetti() {
  const end = Date.now() + 1200;
  const colors = ["#F5B301", "#FFD666", "#7C3AED", "#A78BFA", "#FFFFFF"];
  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 65,
      startVelocity: 55,
      origin: { x: 0, y: 0.7 },
      colors,
      scalar: 0.9,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 65,
      startVelocity: 55,
      origin: { x: 1, y: 0.7 },
      colors,
      scalar: 0.9,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
  // Center burst
  setTimeout(() => {
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.55 },
      colors,
      scalar: 1,
    });
  }, 150);
}

export function PioneerCelebration({
  userId,
  pioneerNumber,
}: {
  userId: string | undefined;
  pioneerNumber: number | null | undefined;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    if (!pioneerNumber || pioneerNumber < 1 || pioneerNumber > 25) return;
    const key = STORAGE_PREFIX + userId;
    if (localStorage.getItem(key) === "1") return;
    setOpen(true);
    // Delay confetti to align with entrance animation.
    const t = setTimeout(fireConfetti, 220);
    return () => clearTimeout(t);
  }, [userId, pioneerNumber]);

  const dismiss = () => {
    if (userId && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_PREFIX + userId, "1");
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-background/85 px-5 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pioneer-title"
        >
          <motion.div
            initial={{ y: 24, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-7 text-center"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-24 -z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ duration: 0.6 }}
              style={{
                background:
                  "radial-gradient(45% 40% at 50% 35%, oklch(0.85 0.16 85 / 0.35), transparent 70%)",
              }}
            />
            <motion.div
              className="mx-auto grid h-24 w-24 place-items-center rounded-3xl"
              initial={{ scale: 0.6, rotate: -8 }}
              animate={{
                scale: 1,
                rotate: 0,
                boxShadow: [
                  "0 0 0 rgba(245,179,1,0)",
                  "0 0 40px rgba(245,179,1,0.55)",
                  "0 0 24px rgba(245,179,1,0.35)",
                ],
              }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.85 0.16 85), oklch(0.72 0.19 45))",
              }}
            >
              <Trophy className="h-11 w-11 text-white drop-shadow" />
            </motion.div>

            <motion.h2
              id="pioneer-title"
              className="mt-5 text-2xl font-extrabold tracking-tight"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              🏆 Congratulations!
            </motion.h2>
            <motion.p
              className="mt-3 text-lg font-bold"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                backgroundImage:
                  "linear-gradient(90deg, oklch(0.85 0.16 85), oklch(0.72 0.19 45))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              You're Pioneer #{pioneerNumber}
            </motion.p>
            <motion.p
              className="mt-3 text-sm leading-relaxed text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              You're one of the first 25 explorers to join SideQuest.
              <br />
              Your Pioneer status is permanent.
            </motion.p>

            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Button
                size="lg"
                className="h-12 w-full font-semibold"
                onClick={dismiss}
              >
                Let's Explore
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}