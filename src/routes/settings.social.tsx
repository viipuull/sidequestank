import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { getMySocialSettings, updateMySocialSettings, type SocialSettings } from "@/lib/social.functions";

export const Route = createFileRoute("/settings/social")({
  head: () => ({ meta: [
    { title: "Social Settings — SideQuest" },
    { name: "description", content: "Control your public profile, leaderboard visibility, and privacy." },
    { name: "robots", content: "noindex" },
  ]}),
  component: () => (<AuthGate><SocialSettingsPage /></AuthGate>),
});

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-[11px] text-muted-foreground">{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition ${checked ? "left-5" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function SocialSettingsPage() {
  const qc = useQueryClient();
  const fetchS = useServerFn(getMySocialSettings);
  const update = useServerFn(updateMySocialSettings);
  const q = useQuery({ queryKey: ["my-social-settings"], queryFn: () => fetchS() });
  const [local, setLocal] = useState<SocialSettings | null>(null);
  useEffect(() => { if (q.data) setLocal(q.data); }, [q.data]);

  const mut = useMutation({
    mutationFn: (patch: Partial<SocialSettings>) => update({ data: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-social-settings"] }),
  });

  function set<K extends keyof SocialSettings>(key: K, value: SocialSettings[K]) {
    if (!local) return;
    const next = { ...local, [key]: value };
    setLocal(next);
    mut.mutate({ [key]: value } as Partial<SocialSettings>);
  }

  if (!local) return <AppShell><div className="mt-20 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AppShell>;

  return (
    <AppShell>
      <Link to="/profile" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Profile</Link>
      <header className="mt-3 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Social & Privacy</h1>
      </header>
      <p className="mt-1 text-xs text-muted-foreground">Choose what other explorers can see about you.</p>

      <section className="mt-5 space-y-2">
        <Toggle label="Public profile" desc="Allow anyone to view your explorer profile." checked={local.public_profile} onChange={(v) => set("public_profile", v)} />
        <Toggle label="Appear on leaderboards" checked={local.appear_on_leaderboard} onChange={(v) => set("appear_on_leaderboard", v)} />
        <Toggle label="Show statistics" checked={local.show_stats} onChange={(v) => set("show_stats", v)} />
        <Toggle label="Show level" checked={local.show_level} onChange={(v) => set("show_level", v)} />
        <Toggle label="Show XP" checked={local.show_xp} onChange={(v) => set("show_xp", v)} />
        <Toggle label="Show titles" checked={local.show_titles} onChange={(v) => set("show_titles", v)} />
        <Toggle label="Show achievements" checked={local.show_achievements} onChange={(v) => set("show_achievements", v)} />
        <Toggle label="Show collections" checked={local.show_collections} onChange={(v) => set("show_collections", v)} />
        <Toggle label="Allow friend requests (soon)" checked={local.allow_friend_requests} onChange={(v) => set("allow_friend_requests", v)} />
        <Toggle label="Allow followers (soon)" checked={local.allow_followers} onChange={(v) => set("allow_followers", v)} />
      </section>

      <section className="mt-5 space-y-2">
        <label className="block">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Bio</p>
          <textarea maxLength={280} value={local.bio ?? ""}
            onChange={(e) => setLocal({ ...local, bio: e.target.value })}
            onBlur={() => mut.mutate({ bio: local.bio })}
            className="mt-1 w-full rounded-2xl border border-border bg-card/60 p-3 text-sm outline-none"
            placeholder="Say something about your adventures…" rows={3} />
        </label>
      </section>
    </AppShell>
  );
}
