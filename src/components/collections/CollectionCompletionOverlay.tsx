import { motion } from "framer-motion";
import { Award, Sparkles, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { useEffect } from "react";

export type CompletedCollectionData = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  cover_image_url: string | null;
  banner_image_url: string | null;
  reward_xp: number;
  reward_summary: string;
};

export function CollectionCompletionOverlay({
  collections,
  onDismiss,
}: {
  collections: CompletedCollectionData[];
  onDismiss: () => void;
}) {
  const current = collections[0];

  useEffect(() => {
    if (!current) return;
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#a855f7", "#ec4899", "#22d3ee", "#facc15"],
    });
  }, [current]);

  if (!current) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 px-6 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 260 }}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-primary/40 bg-card shadow-2xl"
      >
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/70 backdrop-blur active:scale-95"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="relative h-36 w-full overflow-hidden">
          {current.banner_image_url || current.cover_image_url ? (
            <img
              src={current.banner_image_url ?? current.cover_image_url ?? undefined}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/40 via-fuchsia-500/30 to-transparent text-6xl">
              {current.icon}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        </div>
        <div className="-mt-10 px-6 pb-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-primary/40 bg-background text-4xl shadow-xl"
          >
            {current.icon}
          </motion.div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
            Collection complete
          </p>
          <h2 className="mt-1 text-xl font-bold leading-tight">{current.name}</h2>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" /> +{current.reward_xp} XP bonus
            </div>
            {current.reward_summary && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-background/60 px-4 py-2 text-xs text-muted-foreground">
                <Award className="h-4 w-4 text-primary" /> {current.reward_summary}
              </div>
            )}
          </div>
          <div className="mt-5 flex gap-2">
            <button
              onClick={onDismiss}
              className="flex-1 rounded-2xl border border-border bg-background/60 py-3 text-sm font-semibold active:scale-[0.97]"
            >
              {collections.length > 1 ? "Next" : "Continue"}
            </button>
            <Link
              to="/collections/$slug"
              params={{ slug: current.slug }}
              onClick={onDismiss}
              className="flex-1 rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground shadow-lg active:scale-[0.97]"
            >
              View collection
            </Link>
          </div>
          {collections.length > 1 && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              +{collections.length - 1} more collection{collections.length - 1 === 1 ? "" : "s"} completed
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}