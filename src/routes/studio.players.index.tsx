import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Loader2, Shield, EyeOff, Crown, Star, User as UserIcon } from "lucide-react";
import { listPlayers, type AdminPlayerRow } from "@/lib/admin/players.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/feedback";

export const Route = createFileRoute("/studio/players/")({
  component: PlayersIndex,
});

function PlayersIndex() {
  const list = useServerFn(listPlayers);
  const [search, setSearch] = useState("");
  const [onlySuspended, setOnlySuspended] = useState(false);
  const [onlyHidden, setOnlyHidden] = useState(false);
  const [onlyPioneer, setOnlyPioneer] = useState(false);
  const [onlyFounder, setOnlyFounder] = useState(false);
  const [minLevel, setMinLevel] = useState<string>("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const filters = { search, onlySuspended, onlyHidden, onlyPioneer, onlyFounder,
    minLevel: minLevel ? Number(minLevel) : undefined, limit: pageSize, offset: page * pageSize };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-players", filters],
    queryFn: () => list({ data: filters }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Players</div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Player Management</h1>
          <p className="text-sm text-muted-foreground">Search, moderate, and manage every account.</p>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }}
              placeholder="Search name or username…" className="pl-8" aria-label="Search players" />
          </div>
          <Input type="number" value={minLevel} onChange={(e) => { setPage(0); setMinLevel(e.target.value); }}
            placeholder="Min level" className="w-28" aria-label="Minimum level" />
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          {[
            { l: "Suspended", v: onlySuspended, s: setOnlySuspended },
            { l: "Hidden", v: onlyHidden, s: setOnlyHidden },
            { l: "Pioneers", v: onlyPioneer, s: setOnlyPioneer },
            { l: "Founders", v: onlyFounder, s: setOnlyFounder },
          ].map(({ l, v, s }) => (
            <label key={l} className="flex items-center gap-2 cursor-pointer">
              <Switch checked={v} onCheckedChange={(c) => { setPage(0); s(!!c); }} aria-label={l} />
              <Label>{l}</Label>
            </label>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (data ?? []).length === 0 ? (
          <EmptyState title="No players found" body="Try adjusting search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Player</th>
                  <th className="text-left p-3">City</th>
                  <th className="text-right p-3">Lvl</th>
                  <th className="text-right p-3">XP</th>
                  <th className="text-right p-3">Quests</th>
                  <th className="text-left p-3">Flags</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(data as AdminPlayerRow[]).map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center text-xs">
                            <UserIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.display_name}</div>
                          <div className="text-xs text-muted-foreground truncate">@{p.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.city || "—"}</td>
                    <td className="p-3 text-right tabular-nums">{p.level}</td>
                    <td className="p-3 text-right tabular-nums">{p.xp.toLocaleString()}</td>
                    <td className="p-3 text-right tabular-nums">{p.quests_completed}</td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.is_founder && <Badge icon={<Crown className="h-3 w-3" />} label="Founder" tone="amber" />}
                        {p.is_pioneer && <Badge icon={<Star className="h-3 w-3" />} label={`#${p.pioneer_number}`} tone="purple" />}
                        {p.suspended_at && <Badge icon={<Shield className="h-3 w-3" />} label="Suspended" tone="red" />}
                        {p.moderation_hidden && <Badge icon={<EyeOff className="h-3 w-3" />} label="Hidden" tone="gray" />}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/studio/players/$userId" params={{ userId: p.id }}>Manage</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {page + 1} {isFetching && "· refreshing…"}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
          <Button size="sm" variant="outline" disabled={(data ?? []).length < pageSize} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: "amber"|"purple"|"red"|"gray" }) {
  const map = {
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    purple: "bg-primary/15 text-primary border-primary/30",
    red: "bg-red-500/15 text-red-300 border-red-500/30",
    gray: "bg-muted text-muted-foreground border-border",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${map}`}>
      {icon}{label}
    </span>
  );
}