import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Loader2, Lock, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { AuthGate } from "@/components/layout/AuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RARITY_STYLES,
  useEquipTitle,
  useTitlesCatalog,
  useUnequipTitle,
} from "@/lib/hooks/useTitles";
import { toast } from "sonner";

const RARITIES = ["all", "common", "uncommon", "rare", "epic", "legendary", "mythic"] as const;
const FILTERS = [
  { id: "all", label: "All" },
  { id: "unlocked", label: "Unlocked" },
  { id: "locked", label: "Locked" },
] as const;

export const Route = createFileRoute("/titles")({
  head: () => ({
    meta: [
      { title: "Titles — SideQuest" },
      { name: "description", content: "Every SideQuest title you can earn and equip on your explorer profile." },
      { property: "og:title", content: "Titles — SideQuest" },
      { property: "og:description", content: "Collect prestigious titles as you complete SideQuest adventures." },
    ],
  }),
  component: () => (<AuthGate><TitlesGallery /></AuthGate>),
});

function TitlesGallery() {
  const { data, isLoading } = useTitlesCatalog();
  const equip = useEquipTitle();
  const unequip = useUnequipTitle();
  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState<(typeof RARITIES)[number]>("all");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const ownedMap = useMemo(() => {
    const m = new Map<string, { equipped: boolean; unlocked_at: string; source: string }>();
    for (const o of data?.owned ?? []) m.set(o.title_id, { equipped: o.equipped, unlocked_at: o.unlocked_at, source: o.source });
    return m;
  }, [data]);

  const rows = useMemo(() => {
    const list = (data?.titles ?? []).filter((t) => {
      if (rarity !== "all" && t.rarity !== rarity) return false;
      const owned = ownedMap.has(t.id);
      if (filter === "unlocked" && !owned) return false;
      if (filter === "locked" && owned) return false;
      if (q.trim() && !`${t.name} ${t.description}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
    return list;
  }, [data, ownedMap, q, rarity, filter]);

  return (
    <div className="min-h-[100dvh] bg-background pb-16 text-foreground" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2 px-5 py-3">
          <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full border border-border/60" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-sm font-bold">Titles</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {ownedMap.size} / {data?.titles.length ?? 0} unlocked
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-5 py-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles" className="pl-9" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${filter === f.id ? "border-primary bg-primary/15 text-primary" : "border-border bg-card/60 text-muted-foreground"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RARITIES.map((r) => (
            <button
              key={r}
              onClick={() => setRarity(r)}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold capitalize transition ${rarity === r ? "border-primary bg-primary/15 text-primary" : "border-border bg-card/60 text-muted-foreground"}`}
            >
              {r}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        )}

        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {rows.map((t) => {
              const owned = ownedMap.get(t.id);
              const style = RARITY_STYLES[t.rarity] ?? RARITY_STYLES.common;
              const unlockText = describeUnlock(t.unlock_type, t.unlock_requirement as Record<string, unknown>);
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`rounded-2xl border ${style.ring} p-3 backdrop-blur`}
                  style={{ background: owned ? style.bg : "oklch(0.18 0.02 260 / 0.5)", boxShadow: owned ? style.glow : undefined }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
                      style={{ background: "oklch(0.14 0.02 260 / 0.6)", filter: owned ? undefined : "grayscale(1) opacity(0.55)" }}
                    >
                      {t.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold" style={{ color: owned ? (t.color ?? style.text) : undefined }}>
                          {t.name}
                        </p>
                        <span className="rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest"
                          style={{ borderColor: style.text, color: style.text }}>
                          {t.rarity}
                        </span>
                        {owned?.equipped && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
                            <Sparkles className="h-2.5 w-2.5" /> Equipped
                          </span>
                        )}
                      </div>
                      {t.description && <p className="mt-0.5 text-[11px] text-muted-foreground">{t.description}</p>}
                      <p className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {owned ? <><Check className="h-2.5 w-2.5 text-emerald-400" /> Unlocked {new Date(owned.unlocked_at).toLocaleDateString()}</> : <><Lock className="h-2.5 w-2.5" /> {unlockText}</>}
                      </p>
                    </div>
                    {owned && (
                      owned.equipped ? (
                        <Button
                          size="sm" variant="outline"
                          disabled={unequip.isPending}
                          onClick={() => unequip.mutate(undefined, { onSuccess: () => toast.success("Title unequipped") })}
                        >
                          Unequip
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={equip.isPending}
                          onClick={() => equip.mutate(t.id, { onSuccess: () => toast.success(`${t.name} equipped`) })}
                        >
                          Equip
                        </Button>
                      )
                    )}
                  </div>
                </motion.div>
              );
            })}
            {!isLoading && rows.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">No titles match your filters.</p>
            )}
          </div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function describeUnlock(type: string, req: Record<string, unknown>): string {
  switch (type) {
    case "reach_level": return `Reach Level ${req.level ?? "?"}`;
    case "quest_count": return `Complete ${req.count ?? "?"} quests`;
    case "specific_quest": return `Complete a specific quest`;
    case "pioneer": return `Awarded to the first 25 explorers`;
    case "founder": return `Awarded to the founder`;
    case "manual": return `Awarded manually by the team`;
    case "event": return `Earned during a special event`;
    default: return "Locked";
  }
}
