import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Search, Users } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { PlayerCard } from "@/components/social/PlayerCard";
import { discoverPlayers, listFeaturedPlayers } from "@/lib/social.functions";
import { PlayerAvatar } from "@/components/social/PlayerAvatar";
import { Link } from "@tanstack/react-router";

type Sort = "top_xp" | "top_level" | "most_collections" | "most_achievements" | "most_active" | "newest";
const SORTS: { key: Sort; label: string }[] = [
  { key: "top_xp", label: "Top XP" },
  { key: "top_level", label: "Top Level" },
  { key: "most_collections", label: "Collections" },
  { key: "most_achievements", label: "Achievements" },
  { key: "most_active", label: "Active" },
  { key: "newest", label: "New" },
];

export const Route = createFileRoute("/players/")({
  head: () => ({
    meta: [
      { title: "Discover Players — SideQuest" },
      { name: "description", content: "Meet fellow explorers, discover top players, and find inspiration for your next adventure." },
      { property: "og:title", content: "Discover Players — SideQuest" },
      { property: "og:description", content: "Meet the SideQuest community of real-world explorers." },
    ],
  }),
  component: () => (
    <AuthGate>
      <PlayersPage />
    </AuthGate>
  ),
});

function PlayersPage() {
  const [sort, setSort] = useState<Sort>("top_xp");
  const [query, setQuery] = useState("");
  const fetchList = useServerFn(discoverPlayers);
  const fetchFeatured = useServerFn(listFeaturedPlayers);

  const listQ = useQuery({
    queryKey: ["discover-players", sort, query],
    queryFn: () => fetchList({ data: { sort, query: query || undefined, limit: 30, offset: 0 } }),
    staleTime: 60_000,
  });
  const featQ = useQuery({ queryKey: ["featured-players"], queryFn: () => fetchFeatured() });

  return (
    <AppShell>
      <header className="flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Discover Players</h1>
      </header>

      {(featQ.data?.length ?? 0) > 0 && (
        <section className="mt-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Featured</p>
          <div className="mt-2 -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
            {featQ.data!.map((f) => (
              <Link key={f.id} to="/players/$username" params={{ username: f.profiles.username }}
                className="min-w-[180px] snap-start rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-300/15 to-fuchsia-500/10 p-3 active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <PlayerAvatar url={f.profiles.avatar_url} name={f.profiles.display_name} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{f.profiles.display_name}</p>
                    <p className="text-[11px] text-muted-foreground">Lv {f.profiles.level}</p>
                  </div>
                </div>
                {f.blurb && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{f.blurb}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or @username"
          className="flex-1 bg-transparent text-sm outline-none" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <button key={s.key} onClick={() => setSort(s.key)}
            className={`rounded-full border px-3 py-1.5 text-xs transition active:scale-95 ${
              sort === s.key ? "border-primary bg-primary/15 text-primary" : "border-border bg-card/60 text-muted-foreground"
            }`}>{s.label}</button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {listQ.isLoading && (
          <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        )}
        {listQ.data?.length === 0 && !listQ.isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">No players match your filters.</p>
        )}
        {(listQ.data ?? []).map((p, i) => (
          <PlayerCard key={p.user_id} player={p} index={i} />
        ))}
      </div>
    </AppShell>
  );
}
