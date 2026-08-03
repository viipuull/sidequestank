import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Map as MapIcon, Rows3, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { QuestCard } from "@/components/quests/QuestCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listPublishedQuests } from "@/lib/quests.functions";
import { QUEST_CATEGORIES, QUEST_DIFFICULTIES } from "@/lib/quests.types";
import { useAuth } from "@/lib/hooks/useAuth";
import { QuestGridSkeleton } from "@/components/feedback";
import { WorldMap } from "@/components/world/WorldMap";
import { listMySessions } from "@/lib/gameplay.functions";
import { useMyProgress } from "@/lib/hooks/useProgression";
import type { WorldQuest } from "@/lib/world/types";

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
  const [view, setView] = useState<"map" | "list">("map");

  const listQuests = useServerFn(listPublishedQuests);
  const key = useMemo(() => ["quests", { search, category, difficulty, sort }], [search, category, difficulty, sort]);
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => listQuests({ data: { search: search || undefined, category, difficulty, sort } }),
  });

  const mySessions = useServerFn(listMySessions);
  const { data: sessions } = useQuery({
    queryKey: ["my-sessions", "world"],
    enabled: !!user,
    queryFn: () => mySessions({}),
    staleTime: 30_000,
  });
  const { data: progress } = useMyProgress(!!user);

  const completedIds = useMemo(
    () =>
      (sessions ?? [])
        .filter((s: { status: string }) => s.status === "completed")
        .map((s: { quest_id: string }) => s.quest_id),
    [sessions],
  );

  return (
    <AppShell wide={view === "map"}>
      <div className="space-y-5">
        <header className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Compass className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-widest">Discover</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">Quests</h1>
              <p className="text-xs text-muted-foreground">
                Real adventures across your city.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isFounder && (
                <Link
                  to="/founder/quests"
                  className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  Studio
                </Link>
              )}
              <div className="flex rounded-full border border-border/70 bg-card/50 p-0.5 backdrop-blur-xl">
                <ViewTab
                  active={view === "map"}
                  onClick={() => setView("map")}
                  icon={<MapIcon className="h-3.5 w-3.5" />}
                >
                  World
                </ViewTab>
                <ViewTab
                  active={view === "list"}
                  onClick={() => setView("list")}
                  icon={<Rows3 className="h-3.5 w-3.5" />}
                >
                  List
                </ViewTab>
              </div>
            </div>
          </div>

          {view === "list" && (
            <ControlsBar
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              sort={sort}
              setSort={setSort}
            />
          )}
        </header>

        {view === "map" ? (
          <div className="relative">
            <WorldMap
              quests={(data ?? []) as unknown as WorldQuest[]}
              completedIds={completedIds}
              level={progress?.current_level ?? null}
              xpInLevel={progress?.current_level_xp ?? null}
              xpForLevel={progress?.xp_for_next_level ?? null}
              className="h-[72vh] min-h-[460px] lg:h-[76vh]"
            />
            {/* Floating glass control deck over the live map. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[700] p-3">
              <div className="map-overlay pointer-events-auto mx-auto w-full max-w-xl rounded-2xl p-2.5">
                <ControlsBar
                  compact
                  search={search}
                  setSearch={setSearch}
                  category={category}
                  setCategory={setCategory}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  sort={sort}
                  setSort={setSort}
                />
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <QuestGridSkeleton count={3} />
        ) : !data || data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.map((q, i) => (
              <QuestCard key={q.id} quest={q as never} index={i} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

type ControlsProps = {
  compact?: boolean;
  search: string;
  setSearch: (v: string) => void;
  category: string | undefined;
  setCategory: (v: string | undefined) => void;
  difficulty: string | undefined;
  setDifficulty: (v: string | undefined) => void;
  sort: "newest" | "featured" | "quickest";
  setSort: (v: "newest" | "featured" | "quickest") => void;
};

/** Search + category/sort chips. Shared by the list header and map overlay. */
function ControlsBar({
  compact = false,
  search,
  setSearch,
  category,
  setCategory,
  difficulty,
  setDifficulty,
  sort,
  setSort,
}: ControlsProps) {
  return (
      <div className={compact ? "space-y-2" : "space-y-2.5"}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quests, places, categories…"
            className={`rounded-xl pl-9 ${compact ? "h-10 bg-background/40" : "h-11"}`}
          />
        </div>

        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
          <FilterChip active={!category} onClick={() => setCategory(undefined)}>
            All
          </FilterChip>
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

        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
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
      </div>
  );
}

function ViewTab({
  active,
  onClick,
  icon,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
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
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border/70 bg-card/50 text-muted-foreground backdrop-blur-xl hover:border-primary/40 hover:text-foreground"
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