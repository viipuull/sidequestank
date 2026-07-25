import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_PREFIX = "sq_welcome_seen_v1:";

export function WelcomePopup({ userId }: { userId: string | undefined }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const key = STORAGE_PREFIX + userId;
    if (localStorage.getItem(key) !== "1") {
      setOpen(true);
    }
  }, [userId]);

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
          className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-background/70 px-4 pb-6 pt-10 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
        >
          <motion.div
            initial={{ y: 40, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 text-center"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
              <PartyPopper className="h-7 w-7" />
            </div>
            <h2 id="welcome-title" className="mt-4 text-xl font-bold tracking-tight">
              🎉 Welcome to SideQuest Beta!
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Welcome to SideQuest! You're one of our earliest explorers helping shape the adventure.
              More exciting quests and features are coming soon.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button size="lg" className="h-12 w-full font-semibold" onClick={dismiss}>
                Let's Explore
              </Button>
              <Button size="lg" variant="ghost" className="h-11 w-full" onClick={dismiss}>
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}