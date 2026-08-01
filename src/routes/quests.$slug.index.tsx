import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Loader2, Sparkles, Star, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { getPublishedQuestBySlug } from "@/lib/quests.functions";
import { startOrResumeSession, getActiveSessionForQuest } from "@/lib/gameplay.functions";
import { getCollectionsForQuest } from "@/lib/collections.functions";
import { QUEST_CATEGORIES, QUEST_DIFFICULTIES, QUEST_TYPES, OBJECTIVE_TYPES } from "@/lib/quests.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/quests/$slug/")({
  head: ({ params }) => ({
    meta: [
      { title: `Quest — ${params.slug} — SideQuest` },
      { name: "description", content: "Take on a real-world SideQuest adventure." },
      { property: "og:title", content: `SideQuest — ${params.slug}` },
      { property: "og:description", content: "Take on a real-world SideQuest adventure." },
    ],
  }),
  component: QuestDetailPage,
});

function QuestDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [starting, setStarting] = useState(false);

  const fetchQuest = useServerFn(getPublishedQuestBySlug);
  const { data, isLoading } = useQuery({
    queryKey: ["quest", slug],
    queryFn: () => fetchQuest({ data: { slug } }),
  });

  const fetchActive = useServerFn(getActiveSessionForQuest);
  const startFn = useServerFn(startOrResumeSession);
  const { data: activeSession } = useQuery({
    queryKey: ["quest-active-session", data?.id],
    enabled: !!data?.id && !!user,
    queryFn: () => fetchActive({ data: { questId: data!.id } }),
  });
  const collectionsFn = useServerFn(getCollectionsForQuest);
  const { data: parentCollections } = useQuery({
    queryKey: ["quest-collections", data?.id],
    enabled: !!data?.id,
    queryFn: () => collectionsFn({ data: { questId: data!.id } }),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Quest not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This quest may be unpublished or removed.</p>
          <Link to="/quests" className="mt-4 inline-block text-primary underline">Back to quests</Link>
        </div>
      </div>
    );
  }

  const cat = QUEST_CATEGORIES.find((c) => c.value === data.category);
  const diff = QUEST_DIFFICULTIES.find((d) => d.value === data.difficulty);
  const type = QUEST_TYPES.find((t) => t.value === data.quest_type);

  const hasOpenSession = !!activeSession?.id && activeSession.status !== "completed" && activeSession.status !== "abandoned";
  const rewardSpent = !!activeSession?.alreadyRewarded && !activeSession?.repeatable;
  const ctaLabel = hasOpenSession ? "Resume Quest" : rewardSpent ? "Play Again · No XP" : "Start Quest";

  async function handleStart() {
    if (!user) {
      toast("Sign in to start this quest");
      navigate({ to: "/auth" });
      return;
    }
    setStarting(true);
    try {
      await startFn({ data: { questId: data!.id } });
      navigate({ to: "/quests/$slug/play", params: { slug } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start quest");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-background pb-28 text-foreground">
      {/* Hero */}
      <div className="relative h-72 w-full overflow-hidden">
        {data.cover_image_url ? (
          <motion.img
            src={data.cover_image_url}
            alt={data.title}
            className="h-full w-full object-cover"
            initial={{ scale: 1.12, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 via-fuchsia-500/25 to-transparent text-7xl">
            {cat?.emoji ?? "🧭"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <Link
          to="/quests"
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-border/60 bg-background/70 backdrop-blur"
          style={{ top: `calc(env(safe-area-inset-top) + 12px)` }}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {data.featured && (
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-lg"
            style={{ top: `calc(env(safe-area-inset-top) + 12px)` }}
          >
            <Sparkles className="h-3 w-3" /> Featured
          </div>
        )}
      </div>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 mx-auto -mt-16 max-w-md space-y-5 px-5"
      >
        <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {cat?.emoji} {cat?.label}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {type?.emoji} {type?.label}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full"
              style={{ color: diff?.color, borderColor: diff?.color }}
            >
              <Star className="mr-1 h-3 w-3" /> {diff?.label}
            </Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight">{data.title}</h1>
          {data.short_description && (
            <p className="mt-2 text-sm text-muted-foreground">{data.short_description}</p>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
            <Stat label="Time" value={`${data.estimated_minutes}m`} icon={<Clock className="h-3.5 w-3.5" />} />
            <Stat label="City" value={data.city} icon={<MapPin className="h-3.5 w-3.5" />} />
            <Stat label="Reward" value={`+${data.reward_xp} XP`} icon={<Sparkles className="h-3.5 w-3.5" />} />
          </div>
        </div>

        {data.full_description && (
          <Section title="About this quest">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {data.full_description}
            </p>
          </Section>
        )}

        {parentCollections && parentCollections.length > 0 && (
          <Section title={`Part of · ${parentCollections.length}`}>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {parentCollections.map((c) => (
                <Link
                  key={c.id}
                  to="/collections/$slug"
                  params={{ slug: c.slug }}
                  className="flex min-w-[160px] items-center gap-2 rounded-2xl border border-border bg-background/40 p-2 active:scale-[0.98]"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-xl">{c.icon}</div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-primary">Collection</p>
                    <p className="truncate text-xs font-semibold">{c.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {data.objectives.length > 0 && (
          <Section title={`Objectives · ${data.objectives.length}`}>
            <ol className="space-y-2">
              {data.objectives.map((o, i) => {
                const t = OBJECTIVE_TYPES.find((x) => x.value === o.objective_type);
                return (
                  <motion.li
                    key={o.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
                    className="flex items-start gap-3 rounded-2xl border border-border/50 bg-background/40 p-3 transition-colors duration-200 hover:border-primary/40"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{o.title}</span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {t?.emoji} {t?.label}
                        </span>
                      </div>
                      {o.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{o.description}</p>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </Section>
        )}

        {data.reward_preview && (
          <Section title="Reward preview">
            <p className="text-sm text-muted-foreground">{data.reward_preview}</p>
          </Section>
        )}

        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.tags.map((t) => (
              <Badge key={t} variant="secondary" className="rounded-full text-[10px]">
                #{t}
              </Badge>
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
            <div className="text-sm font-semibold text-primary">
              {rewardSpent ? "Already earned" : `+${data.reward_xp} XP`}
            </div>
          </div>
          <Button
            size="lg"
            className="h-12 flex-[2] rounded-2xl text-sm font-bold shadow-lg active:scale-[0.97]"
            onClick={handleStart}
            disabled={starting}
          >
            {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-md backdrop-blur-xl">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/40 p-2.5">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">{icon}<span>{label}</span></div>
      <div className="mt-0.5 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}