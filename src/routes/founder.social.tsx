import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, EyeOff, Loader2, RefreshCw, Sparkles, Star, Trash2, Users } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  founderModerateVisibility, founderRecomputeLeaderboards, founderRemoveFeatured,
  founderSearchUsers, founderSetFeatured, listFeaturedPlayers,
  listSeasons, founderCreateSeason,
} from "@/lib/social.functions";
import { PlayerAvatar } from "@/components/social/PlayerAvatar";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";

export const Route = createFileRoute("/founder/social")({
  head: () => ({ meta: [
    { title: "Social Manager — SideQuest Founder" },
    { name: "robots", content: "noindex, nofollow" },
  ]}),
  component: () => (<AuthGate><SocialManager /></AuthGate>),
});

function SocialManager() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL;
  useEffect(() => { if (!loading && !isFounder) navigate({ to: "/home" }); }, [loading, isFounder, navigate]);
  const qc = useQueryClient();

  const listF = useServerFn(listFeaturedPlayers);
  const listS = useServerFn(listSeasons);
  const search = useServerFn(founderSearchUsers);
  const setFeatured = useServerFn(founderSetFeatured);
  const remFeatured = useServerFn(founderRemoveFeatured);
  const moderate = useServerFn(founderModerateVisibility);
  const recompute = useServerFn(founderRecomputeLeaderboards);
  const createSeason = useServerFn(founderCreateSeason);

  const featQ = useQuery({ queryKey: ["featured-players"], queryFn: () => listF(), enabled: isFounder });
  const seasQ = useQuery({ queryKey: ["seasons"], queryFn: () => listS(), enabled: isFounder });

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; username: string; display_name: string; avatar_url: string | null; city: string }>>([]);
  const [busy, setBusy] = useState(false);

  const recMut = useMutation({ mutationFn: () => recompute(), onSuccess: () => qc.invalidateQueries({ queryKey: ["leaderboard"] }) });

  async function doSearch() {
    if (!query.trim()) return;
    setBusy(true);
    try { setResults(await search({ data: { query: query.trim() } })); } finally { setBusy(false); }
  }

  const [seasonName, setSeasonName] = useState("");
  const [seasonSlug, setSeasonSlug] = useState("");

  if (!isFounder) return <div className="grid min-h-[100dvh] place-items-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto max-w-3xl px-5 pb-16 pt-4">
        <Link to="/founder" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Founder</Link>
        <header className="mt-5 flex items-center justify-between">
          <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Founder</p><h1 className="text-2xl font-bold">Social Manager</h1></div>
          <button onClick={() => recMut.mutate()} disabled={recMut.isPending}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary active:scale-95">
            <RefreshCw className={`h-3.5 w-3.5 ${recMut.isPending ? "animate-spin" : ""}`} /> Recompute
          </button>
        </header>

        {/* Search users */}
        <section className="mt-6 rounded-2xl border border-border bg-card/60 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Player search</p>
          <div className="mt-2 flex gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="username or name"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            <button onClick={doSearch} disabled={busy} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-95">Search</button>
          </div>
          <div className="mt-3 space-y-2">
            {results.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-2">
                <div className="flex items-center gap-2">
                  <PlayerAvatar url={r.avatar_url} name={r.display_name} size={36} />
                  <div><p className="text-sm font-medium">{r.display_name}</p><p className="text-[11px] text-muted-foreground">@{r.username} • {r.city}</p></div>
                </div>
                <div className="flex gap-1">
                  <button onClick={async () => { await setFeatured({ data: { user_id: r.id, blurb: "", priority: 10, active: true } }); qc.invalidateQueries({ queryKey: ["featured-players"] }); }}
                    className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-[11px] text-amber-200"><Star className="mr-1 inline h-3 w-3" />Feature</button>
                  <button onClick={async () => { await moderate({ data: { user_id: r.id, hidden: true } }); }}
                    className="rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] text-destructive"><EyeOff className="mr-1 inline h-3 w-3" />Hide</button>
                  <button onClick={async () => { await moderate({ data: { user_id: r.id, hidden: false } }); }}
                    className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">Restore</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured */}
        <section className="mt-6 rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Featured players</p></div>
          <div className="mt-3 space-y-2">
            {(featQ.data ?? []).map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-2">
                <div className="flex items-center gap-2">
                  <PlayerAvatar url={f.profiles.avatar_url} name={f.profiles.display_name} size={36} />
                  <div><p className="text-sm font-medium">{f.profiles.display_name}</p><p className="text-[11px] text-muted-foreground">Priority {f.priority}</p></div>
                </div>
                <button onClick={async () => { await remFeatured({ data: { user_id: f.user_id } }); qc.invalidateQueries({ queryKey: ["featured-players"] }); }}
                  className="text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {featQ.data?.length === 0 && <p className="text-xs text-muted-foreground">No featured players yet.</p>}
          </div>
        </section>

        {/* Seasons */}
        <section className="mt-6 rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /><p className="text-sm font-semibold">Seasons</p></div>
          <div className="mt-3 space-y-2">
            {(seasQ.data ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-2 text-sm">
                <div><p className="font-medium">{s.name}</p><p className="text-[11px] text-muted-foreground">{s.slug} • {s.active ? "Active" : "Ended"}</p></div>
                <p className="text-[11px] text-muted-foreground">{new Date(s.starts_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={seasonName} onChange={(e) => setSeasonName(e.target.value)} placeholder="New season name"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            <input value={seasonSlug} onChange={(e) => setSeasonSlug(e.target.value)} placeholder="slug"
              className="w-32 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            <button onClick={async () => {
              if (seasonName.length < 2 || seasonSlug.length < 2) return;
              await createSeason({ data: { name: seasonName, slug: seasonSlug } });
              setSeasonName(""); setSeasonSlug("");
              qc.invalidateQueries({ queryKey: ["seasons"] });
            }} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-95">Start</button>
          </div>
        </section>
      </div>
    </div>
  );
}
