import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/layout/AuthGate";
import { AdminShell } from "@/components/studio/AdminShell";
import { ErrorState } from "@/components/feedback";
import {
  founderListCampaigns, founderUpsertCampaign, founderDeleteCampaign,
  founderSendCampaign, founderCampaignDeliveries, founderPushOptions,
} from "@/lib/push.functions";

export const Route = createFileRoute("/studio/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Center — SideQuest Studio" },
      { name: "description", content: "Compose, target, schedule and track SideQuest push notifications." },
      { property: "og:title", content: "Notification Center — SideQuest Studio" },
      { property: "og:description", content: "Compose, target, schedule and track SideQuest push notifications." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (<AuthGate><AdminShell><NotificationCenter /></AdminShell></AuthGate>),
});

const KINDS = [
  "new_quest_nearby", "quest_reminder", "event_reminder", "achievement_unlocked",
  "level_up", "collection_completed", "founder_announcement", "daily_reminder", "weekly_summary",
] as const;

type AudienceKind = "everyone" | "player" | "level" | "title" | "city" | "event";

function NotificationCenter() {
  const qc = useQueryClient();
  const listFn = useServerFn(founderListCampaigns);
  const optionsFn = useServerFn(founderPushOptions);
  const upsertFn = useServerFn(founderUpsertCampaign);
  const delFn = useServerFn(founderDeleteCampaign);
  const sendFn = useServerFn(founderSendCampaign);

  const campaigns = useQuery({ queryKey: ["push-campaigns"], queryFn: () => listFn() });
  const options = useQuery({ queryKey: ["push-options"], queryFn: () => optionsFn() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["push-campaigns"] });

  const upsert = useMutation({
    mutationFn: (v: any) => upsertFn({ data: v }),
    onSuccess: () => { toast.success("Saved."); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast("Deleted."); invalidate(); },
  });
  const send = useMutation({
    mutationFn: (id: string) => sendFn({ data: { id } }),
    onSuccess: (r: any) => { toast.success(`Sent to ${r?.sent ?? 0} device(s).`); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Send failed"),
  });

  const [form, setForm] = useState({
    title: "", body: "", image_url: "", deep_link: "/home",
    action_label: "", action_url: "",
    kind: "founder_announcement" as (typeof KINDS)[number],
    audience_kind: "everyone" as AudienceKind,
    audienceValue: "",
    also_inbox: true,
    schedule: false,
    scheduled_at: new Date(Date.now() + 3600_000).toISOString().slice(0, 16),
  });

  const audience = useMemo(() => {
    switch (form.audience_kind) {
      case "player": return { user_id: form.audienceValue };
      case "level": return { min_level: Number(form.audienceValue) || 1 };
      case "title": return { title_id: form.audienceValue };
      case "city": return { city: form.audienceValue };
      case "event": return { event_id: form.audienceValue };
      default: return {};
    }
  }, [form.audience_kind, form.audienceValue]);

  const submit = (status: "draft" | "scheduled", sendNow = false) => {
    if (!form.title.trim() || !form.body.trim()) { toast.error("Title and message are required."); return; }
    upsert.mutate(
      {
        title: form.title, body: form.body,
        image_url: form.image_url || null,
        deep_link: form.deep_link || "/home",
        action_label: form.action_label || null,
        action_url: form.action_url || null,
        kind: form.kind,
        audience_kind: form.audience_kind,
        audience,
        status,
        scheduled_at: status === "scheduled" ? new Date(form.scheduled_at).toISOString() : null,
        also_inbox: form.also_inbox,
      },
      { onSuccess: (saved: any) => { if (sendNow && saved?.id) send.mutate(saved.id); } },
    );
  };

  if (campaigns.isError) {
    return <ErrorState title="Notification Center didn't load" onRetry={() => campaigns.refetch()} />;
  }

  const opts = options.data;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-xs text-muted-foreground">Compose, target, schedule and track push campaigns.</p>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New notification</p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Field label="Title"><Input value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="New quest in Ankleshwar" /></Field>
          <Field label="Type">
            <Select value={form.kind} onChange={(v) => setForm({ ...form, kind: v as any })} options={KINDS as unknown as string[]} />
          </Field>
        </div>
        <Field label="Message">
          <textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="A new side quest just dropped near the clock tower."
            className="w-full rounded-xl border border-border bg-background p-2 text-sm" />
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Image URL (optional)"><Input value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} placeholder="https://…" /></Field>
          <Field label="Deep link"><Input value={form.deep_link} onChange={(v) => setForm({ ...form, deep_link: v })} placeholder="/quests/clock-tower" /></Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Action label (optional)"><Input value={form.action_label} onChange={(v) => setForm({ ...form, action_label: v })} placeholder="Play now" /></Field>
          <Field label="Action link (optional)"><Input value={form.action_url} onChange={(v) => setForm({ ...form, action_url: v })} placeholder="/quests" /></Field>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Field label="Audience">
            <Select value={form.audience_kind}
              onChange={(v) => setForm({ ...form, audience_kind: v as AudienceKind, audienceValue: "" })}
              options={["everyone", "player", "level", "title", "city", "event"]} />
          </Field>
          <Field label="Target">
            {form.audience_kind === "everyone" && <p className="py-2 text-xs text-muted-foreground">All players with notifications on.</p>}
            {form.audience_kind === "level" && (
              <Input type="number" value={form.audienceValue} onChange={(v) => setForm({ ...form, audienceValue: v })} placeholder="Minimum level, e.g. 3" />
            )}
            {form.audience_kind === "city" && (
              <Select value={form.audienceValue} onChange={(v) => setForm({ ...form, audienceValue: v })} options={["", ...(opts?.cities ?? [])]} />
            )}
            {form.audience_kind === "title" && (
              <Select value={form.audienceValue} onChange={(v) => setForm({ ...form, audienceValue: v })}
                options={["", ...(opts?.titles ?? []).map((t) => t.id)]}
                labels={Object.fromEntries((opts?.titles ?? []).map((t) => [t.id, t.name]))} />
            )}
            {form.audience_kind === "event" && (
              <Select value={form.audienceValue} onChange={(v) => setForm({ ...form, audienceValue: v })}
                options={["", ...(opts?.events ?? []).map((e) => e.id)]}
                labels={Object.fromEntries((opts?.events ?? []).map((e) => [e.id, e.name]))} />
            )}
            {form.audience_kind === "player" && (
              <Select value={form.audienceValue} onChange={(v) => setForm({ ...form, audienceValue: v })}
                options={["", ...(opts?.players ?? []).map((p) => p.id)]}
                labels={Object.fromEntries((opts?.players ?? []).map((p) => [p.id, `${p.display_name} (@${p.username}) · Lv ${p.level}`]))} />
            )}
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={form.also_inbox} onChange={(e) => setForm({ ...form, also_inbox: e.target.checked })} />
            Also add to in-app inbox
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.checked })} />
            Schedule for later
          </label>
          {form.schedule && (
            <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              className="rounded-xl border border-border bg-background px-2 py-1.5 text-sm" />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => submit("draft")} disabled={upsert.isPending}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold active:scale-95 disabled:opacity-60">
            Save draft
          </button>
          {form.schedule ? (
            <button onClick={() => submit("scheduled")} disabled={upsert.isPending}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground active:scale-95 disabled:opacity-60">
              Schedule
            </button>
          ) : (
            <button onClick={() => submit("draft", true)} disabled={upsert.isPending || send.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground active:scale-95 disabled:opacity-60">
              {(upsert.isPending || send.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send now
            </button>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</p>
        {campaigns.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {(campaigns.data ?? []).length === 0 && !campaigns.isLoading && (
          <p className="text-sm text-muted-foreground">No campaigns yet.</p>
        )}
        {(campaigns.data ?? []).map((c: any) => (
          <CampaignRow key={c.id} c={c}
            onSend={() => send.mutate(c.id)}
            onDelete={() => del.mutate(c.id)}
            sending={send.isPending} />
        ))}
      </section>
    </div>
  );
}

function CampaignRow({ c, onSend, onDelete, sending }: { c: any; onSend: () => void; onDelete: () => void; sending: boolean }) {
  const [open, setOpen] = useState(false);
  const deliveriesFn = useServerFn(founderCampaignDeliveries);
  const { data: deliveries } = useQuery({
    queryKey: ["push-deliveries", c.id],
    enabled: open,
    queryFn: () => deliveriesFn({ data: { id: c.id } }),
  });

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <button onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold">{c.title}</p>
          <p className="truncate text-xs text-muted-foreground">{c.body}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {c.status} · {c.audience_kind} · {c.kind}
            {c.scheduled_at ? ` · ${new Date(c.scheduled_at).toLocaleString()}` : ""}
            {c.status === "sent" ? ` · ${c.success_count}/${c.success_count + c.failure_count} delivered` : ""}
          </p>
          {c.error && <p className="mt-1 text-[10px] text-destructive">{c.error}</p>}
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {c.status !== "sent" && (
            <button onClick={onSend} disabled={sending} className="text-[11px] font-semibold text-primary disabled:opacity-60">Send</button>
          )}
          <button onClick={onDelete} aria-label="Delete campaign" className="rounded-full p-1.5 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-1 border-t border-border/60 pt-2">
          {(deliveries ?? []).length === 0 && <p className="text-[11px] text-muted-foreground">No delivery records.</p>}
          {(deliveries ?? []).slice(0, 50).map((d: any) => (
            <p key={d.id} className="text-[11px] text-muted-foreground">
              <span className={d.success ? "text-emerald-400" : "text-destructive"}>{d.success ? "✓" : "✕"}</span>{" "}
              …{d.token_tail} {d.error ? `— ${d.error}` : ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Input({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return <input {...rest} value={value} onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-sm" />;
}

function Select({ value, onChange, options, labels }: { value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-sm">
      {options.map((o) => <option key={o} value={o}>{o === "" ? "Select…" : (labels?.[o] ?? o)}</option>)}
    </select>
  );
}