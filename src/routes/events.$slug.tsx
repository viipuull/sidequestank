import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Gift, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { useEventDetail, useJoinEvent, useMyEventProgress } from "@/lib/hooks/useLiveOps";

export const Route = createFileRoute("/events/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Event — ${params.slug} — SideQuest` },
      { name: "description", content: "Join this SideQuest live event." },
      { property: "og:title", content: `SideQuest Event: ${params.slug}` },
      { property: "og:description", content: "Join this SideQuest live event." },
    ],
  }),
  component: () => (<AuthGate><EventDetail /></AuthGate>),
});

function EventDetail() {
  const { slug } = Route.useParams();
  const nav = useNavigate();
  const { data, isLoading } = useEventDetail(slug);
  const { data: progress } = useMyEventProgress(data?.event.id, !!data?.event.id);
  const join = useJoinEvent();

  if (isLoading) return <AppShell><p className="mt-6 text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!data) return <AppShell><p className="mt-6 text-sm text-muted-foreground">Event not found.</p></AppShell>;

  const { event, rewards, quests, challenges } = data;
  const joined = !!progress?.joined;
  const goal = Math.max(0, event.community_goal);
  const pct = goal > 0 ? Math.min(100, Math.round((event.community_progress / goal) * 100)) : null;

  return (
    <AppShell>
      <button onClick={() => nav({ to: "/events" })} className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
        <ArrowLeft className="h-3.5 w-3.5" /> All events
      </button>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 overflow-hidden rounded-3xl border border-border p-5" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-start gap-3 text-primary-foreground">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-3xl">{event.icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-widest opacity-80">{event.event_type.replace(/_/g, " ")}</p>
            <h1 className="text-xl font-bold">{event.name}</h1>
            <p className="mt-1 text-xs opacity-90">Status: {event.status}</p>
          </div>
        </div>
        {event.description && <p className="mt-3 text-sm text-primary-foreground/90">{event.description}</p>}
        {pct !== null && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full bg-white" />
            </div>
            <p className="mt-1 text-[11px] text-primary-foreground/90">Community goal: {event.community_progress}/{goal} ({pct}%)</p>
          </div>
        )}
        {event.ends_at && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-primary-foreground/90">
            <CalendarDays className="h-3.5 w-3.5" /> Ends {new Date(event.ends_at).toLocaleString()}
          </p>
        )}
      </motion.section>

      {!joined ? (
        <button
          onClick={() => join.mutate(event.id)}
          disabled={join.isPending || event.status === "ended"}
          className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md active:scale-[0.99] disabled:opacity-60"
        >
          {event.status === "ended" ? "Event ended" : join.isPending ? "Joining…" : "Join event"}
        </button>
      ) : (
        <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-300">
          <Users className="mr-1 inline h-4 w-4" /> You're in — your contribution counts.
        </div>
      )}

      {rewards.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Gift className="h-4 w-4" /> Rewards
          </h2>
          <div className="space-y-2">
            {rewards.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3 backdrop-blur">
                <span className="text-sm">{r.label || r.kind}</span>
                {r.kind === "xp" && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">+{r.xp_amount} XP</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {quests.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-4 w-4" /> Featured quests
          </h2>
          <div className="space-y-2">
            {quests.map((q) => (
              <Link key={q.quests.id} to="/quests/$slug" params={{ slug: q.quests.slug }} className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3 backdrop-blur active:scale-[0.99]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{q.quests.title}</p>
                  <p className="text-[11px] text-muted-foreground">{q.quests.city} · {q.quests.difficulty}</p>
                </div>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">+{q.quests.reward_xp}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {challenges.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Event challenges</h2>
          <div className="space-y-2">
            {challenges.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3 backdrop-blur">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{c.icon} {c.name}</p><p className="text-[11px] text-muted-foreground">Target: {c.target} · {c.metric.replace(/_/g, " ")}</p></div>
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">+{c.reward_xp}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}