import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Trash2, Zap } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  founderListAllEvents, founderUpsertEvent, founderDeleteEvent,
  founderListAllAnnouncements, founderUpsertAnnouncement, founderDeleteAnnouncement,
  founderListAllChallenges, founderUpsertChallenge, founderDeleteChallenge,
  founderLiveOpsMetrics, tickLiveOps,
} from "@/lib/liveops.functions";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";

export const Route = createFileRoute("/founder/liveops")({
  head: () => ({ meta: [{ title: "LiveOps Manager — SideQuest" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (<AuthGate><LiveOpsManager /></AuthGate>),
});

type Tab = "events" | "challenges" | "announcements";

function LiveOpsManager() {
  const { user } = useAuth();
  const nav = useNavigate();
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL;
  const [tab, setTab] = useState<Tab>("events");

  const metricsFn = useServerFn(founderLiveOpsMetrics);
  const tickFn = useServerFn(tickLiveOps);
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ["liveops-metrics"], enabled: isFounder, queryFn: () => metricsFn(),
  });
  const tick = useMutation({ mutationFn: () => tickFn(), onSuccess: () => refetchMetrics() });

  if (!isFounder) { setTimeout(() => nav({ to: "/home" }), 0); return null; }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto max-w-3xl px-5 pb-16 pt-4">
        <header className="flex items-center justify-between">
          <Link to="/founder" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <ArrowLeft className="h-3.5 w-3.5" /> Founder
          </Link>
          <button onClick={() => tick.mutate()} disabled={tick.isPending}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60">
            <Zap className="h-3.5 w-3.5" /> {tick.isPending ? "Ticking…" : "Tick LiveOps"}
          </button>
        </header>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">LiveOps</p>
          <h1 className="text-2xl font-bold">Manager</h1>
        </div>

        {metrics && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MetricCard label="Live" value={metrics.events_live} />
            <MetricCard label="Scheduled" value={metrics.events_scheduled} />
            <MetricCard label="Challenges" value={metrics.challenges_active} />
          </div>
        )}

        <div className="mt-6 flex gap-1 rounded-full border border-border bg-card/60 p-1 backdrop-blur">
          {(["events","challenges","announcements"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "events" && <EventsPanel />}
        {tab === "challenges" && <ChallengesPanel />}
        {tab === "announcements" && <AnnouncementsPanel />}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-3 backdrop-blur">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function EventsPanel() {
  const listFn = useServerFn(founderListAllEvents);
  const upsertFn = useServerFn(founderUpsertEvent);
  const delFn = useServerFn(founderDeleteEvent);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["founder-events"], queryFn: () => listFn() });
  const upsert = useMutation({
    mutationFn: (v: any) => upsertFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["founder-events"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["founder-events"] }),
  });

  const [form, setForm] = useState({
    slug: "", name: "", description: "", icon: "🎉",
    event_type: "limited_time" as const, status: "draft" as const, visibility: "public" as const,
    featured: false, priority: 0, community_goal: 0, repeatable: false,
    starts_at: new Date().toISOString().slice(0, 16), ends_at: "" as string,
  });

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); upsert.mutate({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      }); }} className="space-y-2 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New event</p>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} required />
          <Input placeholder="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        </div>
        <textarea placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-xl border border-border bg-background p-2 text-sm" rows={2} />
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="icon" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
          <Select value={form.event_type} onChange={(v) => setForm({ ...form, event_type: v as typeof form.event_type })}
            options={["daily_quest_set","weekly_challenge","monthly_challenge","seasonal","holiday","limited_time","founder","community","beta","sponsored"]} />
          <Select value={form.status} onChange={(v) => setForm({ ...form, status: v as typeof form.status })}
            options={["draft","scheduled","live","ended","archived"]} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="datetime-local" value={form.starts_at} onChange={(v) => setForm({ ...form, starts_at: v })} />
          <Input type="datetime-local" value={form.ends_at} onChange={(v) => setForm({ ...form, ends_at: v })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="community goal" value={String(form.community_goal)} onChange={(v) => setForm({ ...form, community_goal: Number(v) || 0 })} />
          <Input type="number" placeholder="priority" value={String(form.priority)} onChange={(v) => setForm({ ...form, priority: Number(v) || 0 })} />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
        </label>
        <button className="w-full rounded-xl bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-60" disabled={upsert.isPending}>
          {upsert.isPending ? "Saving…" : "Create event"}
        </button>
      </form>

      <div className="space-y-2">
        {(data ?? []).map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3 backdrop-blur">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{e.icon} {e.name}</p>
              <p className="text-[10px] text-muted-foreground">{e.slug} · {e.status} · {e.event_type}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => upsert.mutate({
                id: e.id, slug: e.slug, name: e.name, description: e.description, icon: e.icon,
                event_type: e.event_type,
                status: e.status === "draft" ? "scheduled" : e.status === "scheduled" ? "live" : e.status,
                visibility: e.visibility, featured: e.featured, priority: e.priority,
                community_goal: e.community_goal, repeatable: e.repeatable,
                starts_at: e.starts_at, ends_at: e.ends_at,
              })} className="text-[11px] font-semibold text-primary">Promote</button>
              <button onClick={() => del.mutate(e.id)} className="rounded-full p-1.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChallengesPanel() {
  const listFn = useServerFn(founderListAllChallenges);
  const upsertFn = useServerFn(founderUpsertChallenge);
  const delFn = useServerFn(founderDeleteChallenge);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["founder-challenges"], queryFn: () => listFn() });
  const upsert = useMutation({
    mutationFn: (v: any) => upsertFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["founder-challenges"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["founder-challenges"] }),
  });

  const [form, setForm] = useState({
    slug: "", name: "", description: "", icon: "🎯",
    metric: "quests_completed" as const, target: 3,
    reset_frequency: "daily" as const, reward_xp: 100, active: true,
    visibility: "public" as const, display_order: 0,
  });

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(form); }}
        className="space-y-2 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New challenge</p>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} required />
          <Input placeholder="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        </div>
        <textarea placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-xl border border-border bg-background p-2 text-sm" rows={2} />
        <div className="grid grid-cols-2 gap-2">
          <Select value={form.metric} onChange={(v) => setForm({ ...form, metric: v as typeof form.metric })}
            options={["quests_completed","xp_earned","locations_visited","qr_scans","photos_submitted","collections_completed","achievements_unlocked","level_reached","trivia_correct"]} />
          <Select value={form.reset_frequency} onChange={(v) => setForm({ ...form, reset_frequency: v as typeof form.reset_frequency })}
            options={["daily","weekly","monthly","none"]} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="icon" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
          <Input type="number" placeholder="target" value={String(form.target)} onChange={(v) => setForm({ ...form, target: Number(v) || 1 })} />
          <Input type="number" placeholder="reward XP" value={String(form.reward_xp)} onChange={(v) => setForm({ ...form, reward_xp: Number(v) || 0 })} />
        </div>
        <button className="w-full rounded-xl bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-60" disabled={upsert.isPending}>
          {upsert.isPending ? "Saving…" : "Create challenge"}
        </button>
      </form>

      <div className="space-y-2">
        {(data ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3 backdrop-blur">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{c.icon} {c.name}</p>
              <p className="text-[10px] text-muted-foreground">{c.reset_frequency} · {c.metric} · target {c.target} · +{c.reward_xp} XP · {c.active ? "on" : "off"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => upsert.mutate({
                id: c.id, slug: c.slug, name: c.name, description: c.description, icon: c.icon,
                metric: c.metric, target: c.target, reset_frequency: c.reset_frequency,
                reward_xp: c.reward_xp, active: !c.active, visibility: c.visibility, display_order: c.display_order,
              })} className="text-[11px] font-semibold text-primary">{c.active ? "Disable" : "Enable"}</button>
              <button onClick={() => del.mutate(c.id)} className="rounded-full p-1.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnouncementsPanel() {
  const listFn = useServerFn(founderListAllAnnouncements);
  const upsertFn = useServerFn(founderUpsertAnnouncement);
  const delFn = useServerFn(founderDeleteAnnouncement);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["founder-announcements"], queryFn: () => listFn() });
  const upsert = useMutation({
    mutationFn: (v: any) => upsertFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["founder-announcements"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["founder-announcements"] }),
  });

  const [form, setForm] = useState({
    title: "", body: "", icon: "📣",
    priority: "normal" as const, visibility: "public" as const,
    starts_at: new Date().toISOString().slice(0, 16), ends_at: "" as string,
  });

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); upsert.mutate({
        title: form.title, body: form.body, icon: form.icon,
        priority: form.priority, visibility: form.visibility,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      }); }} className="space-y-2 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New announcement</p>
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="icon" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
          <Input placeholder="title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Select value={form.priority} onChange={(v) => setForm({ ...form, priority: v as typeof form.priority })}
            options={["info","normal","high","critical"]} />
        </div>
        <textarea placeholder="body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="w-full rounded-xl border border-border bg-background p-2 text-sm" rows={3} />
        <div className="grid grid-cols-2 gap-2">
          <Input type="datetime-local" value={form.starts_at} onChange={(v) => setForm({ ...form, starts_at: v })} />
          <Input type="datetime-local" value={form.ends_at} onChange={(v) => setForm({ ...form, ends_at: v })} />
        </div>
        <button className="w-full rounded-xl bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-60" disabled={upsert.isPending}>
          {upsert.isPending ? "Saving…" : "Publish announcement"}
        </button>
      </form>

      <div className="space-y-2">
        {(data ?? []).map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3 backdrop-blur">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{a.icon} {a.title}</p>
              <p className="text-[10px] text-muted-foreground">{a.priority} · {new Date(a.starts_at).toLocaleString()}</p>
            </div>
            <button onClick={() => del.mutate(a.id)} className="rounded-full p-1.5 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return <input {...rest} value={value} onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-sm" />;
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-sm">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}