import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAchievementsCatalog } from "@/lib/hooks/useAchievements";
import { BadgeCard } from "@/components/achievements/BadgeCard";
import { RARITY_STYLES } from "@/lib/hooks/useTitles";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — SideQuest" },
      { name: "description", content: "Track badges you've earned exploring Ankleshwar." },
      { property: "og:title", content: "Achievements — SideQuest" },
      { property: "og:description", content: "Track badges you've earned exploring Ankleshwar." },
    ],
  }),
  component: () => (<AuthGate><AchievementsPage /></AuthGate>),
});

const RARITIES = ["all", "common", "uncommon", "rare", "epic", "legendary", "mythic"] as const;
type Status = "all" | "unlocked" | "locked";

function AchievementsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useAchievementsCatalog(!!user);
  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState<(typeof RARITIES)[number]>("all");
  const [status, setStatus] = useState<Status>("all");
  const [category, setCategory] = useState<string>("all");

  const mineMap = useMemo(() => {
    const rows = data?.mine ?? [];
    const m = new Map<string, (typeof rows)[number]>();
    rows.forEach((r) => m.set(r.achievement_id, r));
    return m;
  }, [data]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (data?.achievements ?? []).forEach((a) => set.add(a.category));
    return ["all", ...Array.from(set).sort()];
  }, [data]);

  const list = useMemo(() => {
    const items = (data?.achievements ?? []).filter((a) => {
      const mine = mineMap.get(a.id);
      const completed = !!mine?.completed;
      if (a.hidden && !completed) return false;
      if (rarity !== "all" && a.rarity !== rarity) return false;
      if (category !== "all" && a.category !== category) return false;
      if (status === "unlocked" && !completed) return false;
      if (status === "locked" && completed) return false;
      if (q.trim().length > 0) {
        const t = q.toLowerCase();
        if (!a.name.toLowerCase().includes(t) && !a.description.toLowerCase().includes(t)) return false;
      }
      return true;
    });
    return items;
  }, [data, mineMap, q, rarity, status, category]);

  const total = data?.achievements.filter((a) => !a.hidden || mineMap.get(a.id)?.completed).length ?? 0;
  const done = (data?.mine ?? []).filter((r) => r.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between">
          <Link to="/home" className="inline-flex items-center gap-1 text-sm text-muted-foreground active:scale-95">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> {done}/{total} · {pct}%
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-3xl border border-border bg-card/70 p-5 backdrop-blur"
        >
          <h1 className="text-xl font-bold tracking-tight">Achievements</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Unlock badges by exploring Ankleshwar, completing quests, leveling up, and discovering secrets.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/60">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </motion.div>

        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search achievements"
              className="pl-9"
            />
          </div>
          <FilterRow label="Status">
            {(["all", "unlocked", "locked"] as Status[]).map((s) => (
              <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                {s === "all" ? "All" : s === "unlocked" ? "Unlocked" : "Locked"}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="Rarity">
            {RARITIES.map((r) => (
              <Chip
                key={r}
                active={rarity === r}
                onClick={() => setRarity(r)}
                color={r !== "all" ? RARITY_STYLES[r]?.text : undefined}
              >
                {r === "all" ? "All" : RARITY_STYLES[r]?.label ?? r}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="Category">
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c === "all" ? "All" : humanize(c)}
              </Chip>
            ))}
          </FilterRow>
        </div>

        {isLoading ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No achievements match those filters.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 pb-16 sm:grid-cols-2">
            {list.map((a) => (
              <BadgeCard key={a.id} achievement={a} progress={mineMap.get(a.id) ?? null} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition active:scale-95 ${
        active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
      }`}
      style={active && color ? { color, borderColor: `${color}66` } : undefined}
    >
      {children}
    </button>
  );
}

function humanize(v: string) {
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}