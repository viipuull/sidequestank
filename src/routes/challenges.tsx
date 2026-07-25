import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { useMyChallenges } from "@/lib/hooks/useLiveOps";

export const Route = createFileRoute("/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges — SideQuest" },
      { name: "description", content: "Daily, weekly and monthly challenges in SideQuest." },
      { property: "og:title", content: "Challenges — SideQuest" },
      { property: "og:description", content: "Take on daily, weekly and monthly SideQuest challenges." },
    ],
  }),
  component: () => (<AuthGate><ChallengesPage /></AuthGate>),
});

function ChallengesPage() {
  const { data, isLoading } = useMyChallenges();
  const challenges = data?.challenges ?? [];
  const progress = data?.progress ?? [];

  const grouped = {
    daily: challenges.filter((c) => c.reset_frequency === "daily"),
    weekly: challenges.filter((c) => c.reset_frequency === "weekly"),
    monthly: challenges.filter((c) => c.reset_frequency === "monthly"),
    none: challenges.filter((c) => c.reset_frequency === "none"),
  };

  return (
    <AppShell>
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">LiveOps</p>
        <h1 className="text-2xl font-bold">Challenges</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reset daily, weekly, and monthly. Complete for XP and rewards.</p>
      </header>
      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}

      {(["daily", "weekly", "monthly", "none"] as const).map((freq) => (
        grouped[freq].length > 0 && (
          <section key={freq} className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {freq === "none" ? "Ongoing" : freq}
            </h2>
            <div className="space-y-2">
              {grouped[freq].map((c) => {
                const prog = progress.find((p) => p.challenge_id === c.id);
                const cur = prog?.progress ?? 0;
                const pct = Math.min(100, Math.round((cur / c.target) * 100));
                const done = prog?.completed;
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border p-4 backdrop-blur ${done ? "border-emerald-400/40 bg-emerald-500/10" : "border-border bg-card/70"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{c.icon} {c.name}</p>
                        {c.description && <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>}
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">+{c.reward_xp} XP</span>
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{cur}/{c.target} · {done ? "Completed 🎉" : `${pct}%`}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )
      ))}

      {!isLoading && challenges.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
          No active challenges. Check back soon.
        </p>
      )}
    </AppShell>
  );
}