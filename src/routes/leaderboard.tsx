import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Search, Trophy } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { LeaderboardRow } from "@/components/social/LeaderboardRow";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { getLeaderboard, getMyRank } from "@/lib/leaderboards.functions";

type Scope = "global" | "city";
type Period = "all_time" | "weekly" | "monthly" | "seasonal";

function isoWeekKey(d = new Date()) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
function monthKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — SideQuest" },
      { name: "description", content: "Compete with fellow explorers across your city and the world." },
      { property: "og:title", content: "Leaderboard — SideQuest" },
      { property: "og:description", content: "Rise through the ranks of SideQuest explorers." },
    ],
  }),
  component: () => (
    <AuthGate>
      <LeaderboardPage />
    </AuthGate>
  ),
});

function LeaderboardPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [scope, setScope] = useState<Scope>("global");
  const [period, setPeriod] = useState<Period>("all_time");
  const [query, setQuery] = useState("");

  const scopeKey = scope === "city" ? (profile?.city ?? "").toLowerCase() : "";
  const periodKey = useMemo(() => {
    if (period === "weekly") return isoWeekKey();
    if (period === "monthly") return monthKey();
    if (period === "seasonal") return "current";
    return "all";
  }, [period]);

  const fetchLb = useServerFn(getLeaderboard);
  const fetchMy = useServerFn(getMyRank);

  const listQ = useQuery({
    queryKey: ["leaderboard", scope, scopeKey, period, periodKey, query],
    queryFn: () => fetchLb({ data: { scope, scope_key: scopeKey, period, period_key: periodKey, limit: 100, offset: 0, query: query || undefined } }),
    staleTime: 60_000,
  });
  const myQ = useQuery({
    queryKey: ["my-rank", user?.id, scope, scopeKey, period, periodKey],
    enabled: !!user?.id,
    queryFn: () => fetchMy({ data: { user_id: user!.id, scope, scope_key: scopeKey, period, period_key: periodKey } }),
    staleTime: 60_000,
  });

  return (
    <AppShell>
      <header className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Leaderboard</h1>
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["global","city"] as const).map((s) => (
          <button key={s} onClick={() => setScope(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition active:scale-95 ${
              scope === s ? "border-primary bg-primary/15 text-primary" : "border-border bg-card/60 text-muted-foreground"
            }`}>
            {s === "city" ? (profile?.city ? `${profile.city}` : "City") : "Global"}
          </button>
        ))}
        <span className="mx-1 self-center text-muted-foreground">•</span>
        {(["all_time","weekly","monthly","seasonal"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
              period === p ? "border-accent bg-accent/15 text-accent" : "border-border bg-card/60 text-muted-foreground"
            }`}>
            {p === "all_time" ? "All-Time" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search players…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </div>

      {myQ.data && (
        <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/10 p-3">
          <p className="text-xs uppercase tracking-widest text-primary">Your position</p>
          <div className="mt-1 flex items-baseline gap-3">
            <p className="text-2xl font-black text-foreground">#{myQ.data.rank}</p>
            <p className="text-sm text-muted-foreground">Lv {myQ.data.level} • {myQ.data.xp.toLocaleString()} XP</p>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2">
        {listQ.isLoading && (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {listQ.data?.length === 0 && !listQ.isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">No players on this board yet — be the first!</p>
        )}
        {(listQ.data ?? []).map((entry, i) => (
          <LeaderboardRow key={entry.user_id} entry={entry} index={i} highlight={entry.user_id === user?.id} />
        ))}
      </div>
    </AppShell>
  );
}
