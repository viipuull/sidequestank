import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { QuestCard } from "@/components/quests/QuestCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listPublishedQuests } from "@/lib/quests.functions";
import { QUEST_CATEGORIES, QUEST_DIFFICULTIES } from "@/lib/quests.types";
import { useAuth } from "@/lib/hooks/useAuth";
import { QuestGridSkeleton } from "@/components/feedback";

export const Route = createFileRoute("/quests/")({
  head: () => ({
    meta: [
      { title: "Quests — SideQuest" },
      { name: "description", content: "Discover real-world quests around Ankleshwar." },
      { property: "og:title", content: "Quests — SideQuest" },
      { property: "og:description", content: "Discover real-world quests around Ankleshwar." },
    ],
  }),
  component: QuestsFeedPage,
});

function QuestsFeedPage() {
  const { user } = useAuth();
  const isFounder = (user?.email ?? "").toLowerCase() === "ankleshwarweb@gmail.com";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<"newest" | "featured" | "quickest">("featured");

  const listQuests = useServerFn(listPublishedQuests);
  const key = useMemo(() => ["quests", { search, category, difficulty, sort }], [search, category, difficulty, sort]);
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => listQuests({ data: { search: search || undefined, category, difficulty, sort } }),
  });

  return (
    <AppShell>
      <div className="space-y-5">
        <header className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Compass className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-widest">Discover</span>
              </div>
              <h1 className="text-blaze mt-1 text-3xl font-bold tracking-tight">Quests</h1>
              <p className="text-xs text-muted-foreground">
                Real adventures across your city.
              </p>
            </div>
            {isFounder && (
              <Link
                to="/founder/quests"
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary"
              >
                Studio
              </Link>
            )}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quests"
              className="h-11 rounded-2xl pl-9"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <FilterChip active={!category} onClick={() => setCategory(undefined)}>All</FilterChip>
            {QUEST_CATEGORIES.map((c) => (
              <FilterChip
                key={c.value}
                active={category === c.value}
                onClick={() => setCategory(category === c.value ? undefined : c.value)}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </FilterChip>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {(["featured", "newest", "quickest"] as const).map((s) => (
              <FilterChip key={s} active={sort === s} onClick={() => setSort(s)}>
                {s === "featured" ? "✨ Featured" : s === "newest" ? "🆕 Newest" : "⚡ Quickest"}
              </FilterChip>
            ))}
            {QUEST_DIFFICULTIES.map((d) => (
              <FilterChip
                key={d.value}
                active={difficulty === d.value}
                onClick={() => setDifficulty(difficulty === d.value ? undefined : d.value)}
              >
                {d.label}
              </FilterChip>
            ))}
          </div>
        </header>

        {isLoading ? (
          <QuestGridSkeleton count={3} />
        ) : !data || data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4">
            {data.map((q, i) => (
              <QuestCard key={q.id} quest={q as never} index={i} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all active:scale-95 ${
        active
          ? "neon-primary border-primary bg-primary font-bold text-primary-foreground"
          : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-8 text-center"
    >
      <Sparkles className="mx-auto h-8 w-8 text-primary" />
      <h3 className="mt-3 text-base font-semibold">No quests yet</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        The first adventures in Ankleshwar are being crafted. Check back soon.
      </p>
    </motion.div>
  );
}