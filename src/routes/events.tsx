import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CalendarDays, Flame, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { useLiveEvents } from "@/lib/hooks/useLiveOps";
import { EmptyState, LoadingScreen } from "@/components/feedback";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — SideQuest" },
      { name: "description", content: "Live events, seasonal drops and community challenges in SideQuest Ankleshwar." },
      { property: "og:title", content: "Events — SideQuest" },
      { property: "og:description", content: "Join limited-time SideQuest events and community goals." },
    ],
  }),
  component: () => (<AuthGate><EventsPage /></AuthGate>),
});

function EventsPage() {
  const { data: events, isLoading } = useLiveEvents("all");
  const live = (events ?? []).filter((e) => e.status === "live");
  const upcoming = (events ?? []).filter((e) => e.status === "scheduled");
  const ended = (events ?? []).filter((e) => e.status === "ended");

  return (
    <AppShell>
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">LiveOps</p>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">Join live drops, seasonal takeovers and community goals.</p>
      </header>

      {isLoading && <LoadingScreen label="Loading events" fullscreen={false} />}

      <Section title="Live now" icon={<Flame className="h-4 w-4 text-primary" />} items={live} empty="Nothing live at the moment — check upcoming events below." />
      <Section title="Upcoming" icon={<CalendarDays className="h-4 w-4 text-accent" />} items={upcoming} empty="No events scheduled yet. New drops are added regularly." />
      <Section title="Recent" icon={<Users className="h-4 w-4 text-muted-foreground" />} items={ended.slice(0, 6)} empty="Past events will show up here once the first one wraps." muted />
    </AppShell>
  );
}

function Section({
  title, icon, items, empty, muted,
}: {
  title: string; icon: React.ReactNode;
  items: Array<{ id: string; slug: string; name: string; description: string; icon: string; ends_at: string | null; event_type: string; featured: boolean; community_goal: number; community_progress: number }>;
  empty: string; muted?: boolean;
}) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}<span>{title}</span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/40 p-4 text-center text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((e) => {
            const goal = Math.max(0, e.community_goal);
            const pct = goal > 0 ? Math.min(100, Math.round((e.community_progress / goal) * 100)) : null;
            return (
              <motion.div key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border border-border bg-card/70 p-4 backdrop-blur ${muted ? "opacity-70" : ""}`}>
                <Link to="/events/$slug" params={{ slug: e.slug }} className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-2xl">{e.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{e.name}</p>
                      {e.featured && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase text-accent">Featured</span>}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{e.description || e.event_type.replace(/_/g, " ")}</p>
                    {pct !== null && (
                      <div className="mt-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">Community: {e.community_progress}/{goal} ({pct}%)</p>
                      </div>
                    )}
                    {e.ends_at && <p className="mt-2 text-[10px] text-muted-foreground">Ends {new Date(e.ends_at).toLocaleString()}</p>}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}