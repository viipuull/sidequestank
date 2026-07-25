import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, UserPlus, Activity, Sparkles, Trophy, Boxes, CalendarDays, Radio,
  Compass, Bell, History, ArrowRight, Loader2, ShieldCheck,
} from "lucide-react";
import { getStudioHome, type StudioHomeSnapshot } from "@/lib/studio/index.functions";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/studio/")({
  component: StudioHome,
});

function StatTile({ icon: Icon, label, value, hint, delay = 0 }: { icon: any; label: string; value: string | number; hint?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}
    >
      <Card className="p-4 h-full border-border/60 bg-gradient-to-br from-card to-card/60">
        <div className="flex items-start justify-between">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          {hint && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{hint}</span>}
        </div>
        <div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </Card>
    </motion.div>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-4 border-border/60">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  );
}

function StudioHome() {
  const { user } = useAuth();
  const fetchHome = useServerFn(getStudioHome);
  const { data, isLoading, isError, refetch, isFetching } = useQuery<StudioHomeSnapshot>({
    queryKey: ["studio-home"],
    queryFn: () => fetchHome(),
    refetchInterval: 30_000,
  });

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Founder";

  if (isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Couldn't load studio metrics.</p>
        <Button className="mt-3" size="sm" onClick={() => refetch()}>Retry</Button>
      </Card>
    );
  }

  const s = data.stats;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Studio Home</div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Welcome back, {name}.</h1>
          <p className="text-sm text-muted-foreground">Live snapshot of the SideQuest platform{isFetching ? " · refreshing…" : ""}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm"><Link to="/founder/quests/new"><Sparkles className="mr-1.5 h-4 w-4" />New Quest</Link></Button>
          <Button asChild size="sm" variant="secondary"><Link to="/founder/liveops"><Radio className="mr-1.5 h-4 w-4" />LiveOps</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/studio/audit"><History className="mr-1.5 h-4 w-4" />Audit</Link></Button>
        </div>
      </motion.div>

      <section className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <StatTile icon={Users} label="Total players" value={s.players_total} hint="All time" delay={0.00} />
        <StatTile icon={Activity} label="Active today" value={s.players_active_today} hint="24h" delay={0.03} />
        <StatTile icon={UserPlus} label="New players today" value={s.players_new_today} hint="24h" delay={0.06} />
        <StatTile icon={Compass} label="Quests completed today" value={s.quests_completed_today} hint="24h" delay={0.09} />
        <StatTile icon={Sparkles} label="XP earned today" value={s.xp_earned_today.toLocaleString()} hint="24h" delay={0.12} />
        <StatTile icon={Boxes} label="Collections completed" value={s.collections_completed_today} hint="24h" delay={0.15} />
        <StatTile icon={Trophy} label="Achievements earned" value={s.achievements_earned_today} hint="24h" delay={0.18} />
        <StatTile icon={Radio} label="Live events" value={s.events_live} hint="Now" delay={0.21} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Upcoming events"
          action={<Button asChild size="sm" variant="ghost"><Link to="/founder/liveops">Manage <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}
        >
          {data.upcoming_events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {data.upcoming_events.map((e) => (
                <li key={e.id} className="py-2 flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded bg-primary/10 text-primary text-sm">{e.icon || "🎯"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.event_type} · {new Date(e.starts_at).toLocaleString()}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{e.status}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recently published quests"
          action={<Button asChild size="sm" variant="ghost"><Link to="/founder/quests">Manage <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}
        >
          {data.recent_quests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quests published yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {data.recent_quests.map((q) => (
                <li key={q.id} className="py-2 flex items-center gap-3">
                  <Compass className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{q.title}</div>
                    <div className="text-xs text-muted-foreground">{q.city} · {q.published_at ? formatDistanceToNow(new Date(q.published_at), { addSuffix: true }) : "—"}</div>
                  </div>
                  <Link to="/quests/$slug" params={{ slug: q.slug }} className="text-xs text-primary hover:underline">Open</Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recent notifications"
          action={<Button asChild size="sm" variant="ghost"><Link to="/notifications">All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}
        >
          {data.recent_notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {data.recent_notifications.map((n) => (
                <li key={n.id} className="py-2 flex items-start gap-3">
                  <Bell className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{n.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{n.body}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recent audit activity"
          action={<Button asChild size="sm" variant="ghost"><Link to="/studio/audit">Log <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}
        >
          {data.recent_audit.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No audit events yet. Studio actions will be logged here.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {data.recent_audit.map((a) => (
                <li key={a.id} className="py-2 flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{a.action}</span>{" "}
                      <span className="text-muted-foreground">on {a.target_kind}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.actor_email ?? "system"} · {a.summary ?? "—"}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}