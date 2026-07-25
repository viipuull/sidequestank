import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Clock, Filter, Loader2, Search, Sparkles, Star, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  listPublicCollections,
  myCollections,
  type CollectionCard,
} from "@/lib/collections.functions";

export const Route = createFileRoute("/collections")({
  head: () => ({
    meta: [
      { title: "Collections — SideQuest" },
      { name: "description", content: "Themed quest sets, city trails, seasonal drops and exclusive collectible rewards." },
      { property: "og:title", content: "Collections — SideQuest" },
      { property: "og:description", content: "Themed quest sets, city trails, seasonal drops and exclusive collectible rewards." },
    ],
  }),
  component: CollectionsGallery,
});

type SortMode = "featured" | "progress" | "newest" | "az";
type StatusFilter = "all" | "in_progress" | "completed" | "not_started";

function CollectionsGallery() {
  const { user } = useAuth();
  const publicFn = useServerFn(listPublicCollections);
  const mineFn = useServerFn(myCollections);

  const listQ = useQuery({
    queryKey: user ? ["collections-mine"] : ["collections-public"],
    queryFn: () => (user ? mineFn() : publicFn()),
  });

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("featured");
  const [seasonalOnly, setSeasonalOnly] = useState(false);

  const categories = useMemo(() => {
    const s = new Set<string>();
    (listQ.data ?? []).forEach((c) => s.add(c.category));
    return Array.from(s).sort();
  }, [listQ.data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let rows = (listQ.data ?? []).filter((c) => {
      if (cat !== "all" && c.category !== cat) return false;
      if (seasonalOnly && !c.seasonal) return false;
      if (term && !`${c.name} ${c.description} ${c.tags?.join(" ") ?? ""}`.toLowerCase().includes(term)) return false;
      const p = c.progress;
      if (status === "completed" && !p?.completed) return false;
      if (status === "in_progress" && (!p || p.completed || p.completed_quests === 0)) return false;
      if (status === "not_started" && p && p.completed_quests > 0) return false;
      return true;
    });
    if (sort === "az") rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "newest") rows = [...rows].sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    else if (sort === "progress") rows = [...rows].sort((a, b) => (b.progress?.percent ?? 0) - (a.progress?.percent ?? 0));
    else rows = [...rows].sort((a, b) => Number(b.featured) - Number(a.featured));
    return rows;
  }, [listQ.data, q, cat, status, sort, seasonalOnly]);

  const stats = useMemo(() => {
    const rows = listQ.data ?? [];
    const completed = rows.filter((r) => r.progress?.completed).length;
    const started = rows.filter((r) => r.progress && !r.progress.completed && r.progress.completed_quests > 0).length;
    return { total: rows.length, completed, started };
  }, [listQ.data]);

  return (
    <AppShell>
      <header className="pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Collections</p>
        <h1 className="mt-1 text-2xl font-bold">Themed quest sets & trails</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Complete a full set to unlock exclusive titles, badges and future collectibles.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
          <StatChip icon={<Trophy className="h-3.5 w-3.5" />} label="Total" value={stats.total} />
          <StatChip icon={<Star className="h-3.5 w-3.5" />} label="In progress" value={stats.started} />
          <StatChip icon={<Award className="h-3.5 w-3.5" />} label="Completed" value={stats.completed} />
        </div>
      </header>

      <div className="mt-4 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search collections…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>All</Chip>
          {categories.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "in_progress", "completed", "not_started"] as StatusFilter[]).map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
              {s.replace("_", " ")}
            </Chip>
          ))}
          <Chip active={seasonalOnly} onClick={() => setSeasonalOnly((v) => !v)}>Seasonal</Chip>
          <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
            <Filter className="h-3 w-3" />
            <select
              className="rounded-full border border-border bg-background px-2 py-0.5"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
            >
              <option value="featured">Featured</option>
              <option value="progress">Progress</option>
              <option value="newest">Newest</option>
              <option value="az">A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {listQ.isLoading ? (
        <div className="mt-10 grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          No collections match your filters yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((c) => <CollectionRow key={c.id} c={c} />)}
        </div>
      )}
    </AppShell>
  );
}

function CollectionRow({ c }: { c: CollectionCard }) {
  const p = c.progress;
  const percent = p?.percent ?? 0;
  const completed = p?.completed ?? false;
  return (
    <Link
      to="/collections/$slug"
      params={{ slug: c.slug }}
      className="block overflow-hidden rounded-3xl border border-border bg-card/70 shadow-md backdrop-blur active:scale-[0.99]"
    >
      <div className="relative h-32 w-full overflow-hidden">
        {c.cover_image_url ? (
          <img src={c.cover_image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/30 via-fuchsia-500/20 to-transparent text-5xl">
            {c.icon}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {c.featured && <Badge className="rounded-full bg-primary text-primary-foreground"><Sparkles className="mr-1 h-3 w-3" />Featured</Badge>}
          {c.seasonal && <Badge variant="outline" className="rounded-full bg-background/70 backdrop-blur">Seasonal</Badge>}
          {completed && <Badge className="rounded-full bg-emerald-500/90 text-white">Completed</Badge>}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{c.name}</h3>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{c.description}</p>
          </div>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-xl">{c.icon}</div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3" /> {c.quest_count} quests</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.estimated_minutes}m</span>
          <span className="uppercase tracking-wider">{c.difficulty}</span>
          <span className="text-primary">+{c.reward_xp} XP</span>
        </div>
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500"
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {p?.completed_quests ?? 0} / {p?.total_required ?? c.quest_count} quests · {percent}%
          </p>
        </div>
      </div>
    </Link>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-2.5 backdrop-blur">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">{icon}<span>{label}</span></div>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] capitalize transition ${
        active ? "border-primary bg-primary/15 text-primary" : "border-border bg-background/40 text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}