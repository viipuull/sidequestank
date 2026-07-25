import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { useMyProgress, useMyXpHistory } from "@/lib/hooks/useProgression";
import { XpBar } from "@/components/progression/XpBar";

export const Route = createFileRoute("/xp-history")({
  head: () => ({
    meta: [
      { title: "XP History — SideQuest" },
      { name: "description", content: "Every XP reward you've earned on your SideQuest journey." },
      { property: "og:title", content: "XP History — SideQuest" },
      { property: "og:description", content: "Every XP reward you've earned on your SideQuest journey." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (<AuthGate><XpHistoryPage /></AuthGate>),
});

function XpHistoryPage() {
  const { data: progress } = useMyProgress();
  const { data: events, isLoading } = useMyXpHistory(50);

  return (
    <div className="min-h-[100dvh] bg-background pb-16 text-foreground" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2 px-5 py-3">
          <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full border border-border/60" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-sm font-bold">XP History</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-5 py-5">
        {progress && (
          <motion.section
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-border p-5"
            style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elevated)" }}
          >
            <div className="flex items-center justify-between text-primary-foreground">
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80">Lifetime</p>
                <p className="text-2xl font-black">{progress.lifetime_xp} XP</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider opacity-80">Quests</p>
                <p className="text-2xl font-black">{progress.total_quests_completed}</p>
              </div>
            </div>
            <XpBar
              level={progress.current_level}
              currentLevelXp={progress.current_level_xp}
              xpForNextLevel={progress.xp_for_next_level}
              className="mt-4"
            />
          </motion.section>
        )}

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Activity</h2>
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && (events?.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
              Complete your first quest to start earning XP.
            </div>
          )}
          {(events ?? []).map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3 backdrop-blur"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {e.quests?.title ?? (e.reason === "quest_completed" ? "Quest" : "Bonus")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()} · {e.reason.replace(/_/g, " ")}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                <Sparkles className="h-3 w-3" /> +{e.xp_earned}
              </span>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}
