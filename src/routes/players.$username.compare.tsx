import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { PlayerAvatar } from "@/components/social/PlayerAvatar";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { comparePlayers } from "@/lib/social.functions";

export const Route = createFileRoute("/players/$username/compare")({
  head: ({ params }) => ({ meta: [
    { title: `Compare vs @${params.username} — SideQuest` },
    { name: "description", content: `Head-to-head comparison with @${params.username}.` },
    { name: "robots", content: "noindex" },
  ]}),
  component: () => (<AuthGate><ComparePage /></AuthGate>),
});

function Row({ label, a, b }: { label: string; a: number; b: number }) {
  const aWin = a >= b;
  return (
    <div className="grid grid-cols-5 items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm">
      <span className={`text-right ${aWin ? "text-primary font-bold" : "text-muted-foreground"}`}>{a.toLocaleString()}</span>
      <span className="col-span-3 text-center text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-left ${!aWin ? "text-accent font-bold" : "text-muted-foreground"}`}>{b.toLocaleString()}</span>
    </div>
  );
}

function ComparePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const { data: me } = useProfile(user?.id);
  const fetch = useServerFn(comparePlayers);
  const q = useQuery({
    queryKey: ["compare", me?.username, username],
    enabled: !!me?.username,
    queryFn: () => fetch({ data: { usernameA: me!.username, usernameB: username } }),
  });

  if (!me) return <AppShell><p className="mt-20 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (q.isLoading) return <AppShell><p className="mt-20 text-center text-sm text-muted-foreground">Loading comparison…</p></AppShell>;
  if (!q.data) return (
    <AppShell><div className="mt-20 text-center"><p className="text-sm">Couldn't compare.</p>
      <Link to="/players/$username" params={{ username }} className="mt-3 inline-block text-xs text-primary">Back</Link></div></AppShell>
  );

  const A = q.data.a, B = q.data.b;
  const sa = A.stats ?? { total_xp: 0, level: 1, quests_completed: 0, collections_completed: 0, achievements_earned: 0, titles_earned: 0 };
  const sb = B.stats ?? { total_xp: 0, level: 1, quests_completed: 0, collections_completed: 0, achievements_earned: 0, titles_earned: 0 };

  return (
    <AppShell>
      <Link to="/players/$username" params={{ username }} className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
      <div className="mt-3 flex items-center justify-between rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-transparent to-accent/10 p-4">
        <div className="flex items-center gap-2">
          <PlayerAvatar url={A.profile.avatar_url} name={A.profile.display_name} size={52} />
          <div><p className="text-sm font-bold">{A.profile.display_name}</p><p className="text-[11px] text-muted-foreground">You</p></div>
        </div>
        <span className="text-xs font-black text-muted-foreground">VS</span>
        <div className="flex items-center gap-2">
          <div className="text-right"><p className="text-sm font-bold">{B.profile.display_name}</p><p className="text-[11px] text-muted-foreground">@{B.profile.username}</p></div>
          <PlayerAvatar url={B.profile.avatar_url} name={B.profile.display_name} size={52} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Row label="Level" a={sa.level} b={sb.level} />
        <Row label="Total XP" a={sa.total_xp} b={sb.total_xp} />
        <Row label="Quests" a={sa.quests_completed} b={sb.quests_completed} />
        <Row label="Collections" a={sa.collections_completed} b={sb.collections_completed} />
        <Row label="Badges" a={sa.achievements_earned} b={sb.achievements_earned} />
        <Row label="Titles" a={sa.titles_earned} b={sb.titles_earned} />
      </div>
    </AppShell>
  );
}
