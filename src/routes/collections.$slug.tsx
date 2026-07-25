import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Award, CheckCircle2, Clock, Heart, Loader2, MapPin, Play, Sparkles, Trophy } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import {
  getCollectionBySlug,
  getMyCollectionDetail,
  toggleCollectionFavorite,
} from "@/lib/collections.functions";

export const Route = createFileRoute("/collections/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Collection — ${params.slug} — SideQuest` },
      { name: "description", content: "Complete a themed set of SideQuests to unlock exclusive rewards." },
      { property: "og:title", content: `SideQuest Collection — ${params.slug}` },
      { property: "og:description", content: "Complete a themed set of SideQuests to unlock exclusive rewards." },
    ],
  }),
  component: CollectionDetailPage,
});

function CollectionDetailPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const publicFn = useServerFn(getCollectionBySlug);
  const mineFn = useServerFn(getMyCollectionDetail);
  const favFn = useServerFn(toggleCollectionFavorite);

  const q = useQuery({
    queryKey: ["collection", slug, !!user],
    queryFn: () => (user ? mineFn({ data: { slug } }) : publicFn({ data: { slug } })),
  });

  type DetailShape = {
    collection: NonNullable<Awaited<ReturnType<typeof getCollectionBySlug>>>["collection"];
    items: NonNullable<Awaited<ReturnType<typeof getCollectionBySlug>>>["items"];
    progress?: NonNullable<Awaited<ReturnType<typeof getMyCollectionDetail>>>["progress"] | null;
    completedQuestIds?: string[];
  };
  const detail = (q.data ?? null) as DetailShape | null;
  const collection = detail?.collection ?? null;
  const items = detail?.items ?? [];
  const progress = detail?.progress ?? null;
  const completedIds = new Set<string>(detail?.completedQuestIds ?? []);

  const percent = progress?.percent ?? 0;
  const done = progress?.completed ?? false;

  const nextQuest = useMemo(() => {
    const list = items ?? [];
    return list.find((i) => i.quests && !completedIds.has(i.quests.id))?.quests ?? null;
  }, [items, completedIds]);

  if (q.isLoading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!collection) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Collection not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">It may be unpublished or archived.</p>
          <Link to="/collections" className="mt-4 inline-block text-primary underline">Back to collections</Link>
        </div>
      </div>
    );
  }

  async function handleFavorite() {
    if (!user) { navigate({ to: "/auth" }); return; }
    try {
      await favFn({ data: { collectionId: collection!.id } });
      qc.invalidateQueries({ queryKey: ["collection", slug] });
      qc.invalidateQueries({ queryKey: ["collections-mine"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update favorite");
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-background pb-32 text-foreground">
      <div className="relative h-64 w-full overflow-hidden">
        {collection.banner_image_url || collection.cover_image_url ? (
          <img
            src={collection.banner_image_url ?? collection.cover_image_url ?? undefined}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/40 via-fuchsia-500/25 to-transparent text-7xl">
            {collection.icon}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <Link
          to="/collections"
          className="absolute left-4 grid h-10 w-10 place-items-center rounded-full border border-border/60 bg-background/70 backdrop-blur"
          style={{ top: `calc(env(safe-area-inset-top) + 12px)` }}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button
          onClick={handleFavorite}
          className="absolute right-4 grid h-10 w-10 place-items-center rounded-full border border-border/60 bg-background/70 backdrop-blur active:scale-95"
          style={{ top: `calc(env(safe-area-inset-top) + 12px)` }}
          aria-label="Favorite"
        >
          <Heart className={`h-5 w-5 ${progress?.favorite ? "fill-red-500 text-red-500" : ""}`} />
        </button>
      </div>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto -mt-16 max-w-md space-y-5 px-5"
      >
        <div className="rounded-3xl border border-border/60 bg-card/85 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/15 text-3xl">
              {collection.icon}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1">
                {collection.featured && <Badge className="rounded-full"><Sparkles className="mr-1 h-3 w-3" />Featured</Badge>}
                {collection.seasonal && <Badge variant="outline" className="rounded-full">Seasonal</Badge>}
                {done && <Badge className="rounded-full bg-emerald-500/90 text-white">Completed</Badge>}
                <Badge variant="secondary" className="rounded-full capitalize">{collection.collection_type.replace("_", " ")}</Badge>
              </div>
              <h1 className="mt-1 text-xl font-bold leading-tight">{collection.name}</h1>
            </div>
          </div>
          {collection.description && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {collection.description}
            </p>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
            <MiniStat icon={<Trophy className="h-3.5 w-3.5" />} label="Quests" value={String(items.length)} />
            <MiniStat icon={<Clock className="h-3.5 w-3.5" />} label="Time" value={`${collection.estimated_minutes}m`} />
            <MiniStat icon={<MapPin className="h-3.5 w-3.5" />} label="City" value={collection.city} />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progress</span>
              <span>{progress?.completed_quests ?? 0} / {progress?.total_required ?? items.length} · {percent}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500"
              />
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-md backdrop-blur-xl">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Rewards on completion</h2>
          <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 to-fuchsia-500/10 p-4">
            <Award className="h-10 w-10 shrink-0 text-primary" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-primary">+{collection.reward_xp} XP</p>
              {collection.reward_summary && (
                <p className="mt-0.5 text-xs text-muted-foreground">{collection.reward_summary}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-md backdrop-blur-xl">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Quests · {items.length}
          </h2>
          <ol className="space-y-2">
            {items.map((it, idx) => {
              const qq = it.quests;
              const isDone = qq ? completedIds.has(qq.id) : false;
              return (
                <li
                  key={it.id}
                  className={`flex items-start gap-3 rounded-2xl border p-3 transition ${
                    isDone ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/50 bg-background/40"
                  }`}
                >
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    isDone ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/15 text-primary"
                  }`}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{qq?.title ?? "Removed quest"}</span>
                      {!it.required && <Badge variant="outline" className="text-[10px]">Optional</Badge>}
                    </div>
                    {qq?.short_description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{qq.short_description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>{qq?.difficulty}</span>
                      <span>{qq?.estimated_minutes}m</span>
                      <span className="text-primary">+{qq?.reward_xp} XP</span>
                    </div>
                  </div>
                  {qq && (
                    <Link
                      to="/quests/$slug"
                      params={{ slug: qq.slug }}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary active:scale-95"
                      aria-label="Open quest"
                    >
                      <Play className="h-4 w-4" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {collection.tags && collection.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {collection.tags.map((t) => (
              <Badge key={t} variant="secondary" className="rounded-full text-[10px]">#{t}</Badge>
            ))}
          </div>
        )}
      </motion.main>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 px-5 py-3 backdrop-blur-xl"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)` }}
      >
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reward</div>
            <div className="text-sm font-semibold text-primary">+{collection.reward_xp} XP</div>
          </div>
          <Button
            size="lg"
            className="h-12 flex-[2] rounded-2xl text-sm font-bold shadow-lg active:scale-[0.97]"
            disabled={!nextQuest && !done}
            onClick={() => {
              if (done) { navigate({ to: "/collections" }); return; }
              if (nextQuest) navigate({ to: "/quests/$slug", params: { slug: nextQuest.slug } });
            }}
          >
            {done ? "Explore more collections" : nextQuest ? "Continue collection" : "No quests yet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/40 p-2.5">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">{icon}<span>{label}</span></div>
      <div className="mt-0.5 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}