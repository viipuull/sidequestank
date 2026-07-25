import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pin, PinOff, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAchievementDetail, useToggleFeatured } from "@/lib/hooks/useAchievements";
import { RARITY_STYLES } from "@/lib/hooks/useTitles";

export const Route = createFileRoute("/achievements/$slug")({
  head: () => ({
    meta: [
      { title: "Achievement — SideQuest" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (<AuthGate><AchievementDetail /></AuthGate>),
});

function AchievementDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const { data, isLoading } = useAchievementDetail(slug, !!user);
  const toggle = useToggleFeatured();

  if (isLoading) {
    return (
      <AppShell>
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }
  if (!data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md pt-10 text-center">
          <p className="text-sm text-muted-foreground">Achievement not found.</p>
          <Button className="mt-4" onClick={() => nav({ to: "/achievements" })}>
            Back to Achievements
          </Button>
        </div>
      </AppShell>
    );
  }

  const a = data.achievement;
  const mine = data.mine;
  const completed = !!mine?.completed;
  const isSecretHidden = a.secret && !completed;
  const s = RARITY_STYLES[a.rarity] ?? RARITY_STYLES.common;
  const pct = mine
    ? Math.min(100, Math.round(((mine.progress ?? 0) / Math.max(1, mine.target ?? a.goal_target)) * 100))
    : 0;
  const showTarget = (mine?.target ?? a.goal_target) > 1;

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <Link to="/achievements" className="inline-flex items-center gap-1 text-sm text-muted-foreground active:scale-95">
          <ArrowLeft className="h-4 w-4" /> All achievements
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 rounded-3xl border p-6 text-center backdrop-blur ${s.ring}`}
          style={{
            background: completed
              ? `linear-gradient(180deg, ${s.bg}, oklch(0.14 0.02 260))`
              : "oklch(0.16 0.02 260 / 0.6)",
            boxShadow: completed ? s.glow : undefined,
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: s.text }}>
            {s.label} · {humanize(a.category)}
          </p>
          <div
            className={`mx-auto mt-3 grid h-28 w-28 place-items-center rounded-3xl text-6xl ${
              completed ? "" : "grayscale"
            }`}
            style={{ background: s.bg, boxShadow: completed ? s.glow : undefined }}
            aria-hidden
          >
            {a.badge_image_url ? (
              <img src={a.badge_image_url} alt="" className="h-24 w-24 object-contain" />
            ) : isSecretHidden ? (
              "❔"
            ) : (
              a.icon
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold">{isSecretHidden ? "???" : a.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSecretHidden ? "Secret achievement — unlock to reveal." : a.description}
          </p>
          {showTarget && !isSecretHidden && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-border/60">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.text }} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {mine?.progress ?? 0} / {mine?.target ?? a.goal_target}
              </p>
            </div>
          )}
          {completed && mine?.completed_at && (
            <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
              <Trophy className="h-3 w-3" />
              Unlocked {new Date(mine.completed_at).toLocaleDateString()}
            </p>
          )}
        </motion.div>

        {completed && mine && (
          <Button
            className="mt-4 w-full"
            variant={mine.featured ? "outline" : "default"}
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate(
                { playerAchievementId: mine.id, featured: !mine.featured },
                {
                  onError: (e: unknown) =>
                    toast.error(e instanceof Error ? e.message : "Couldn't update featured badge"),
                },
              )
            }
          >
            {mine.featured ? (
              <><PinOff className="mr-2 h-4 w-4" /> Unpin from showcase</>
            ) : (
              <><Pin className="mr-2 h-4 w-4" /> Pin to showcase</>
            )}
          </Button>
        )}

        <div className="mt-6 rounded-3xl border border-border bg-card/70 p-5 text-xs text-muted-foreground backdrop-blur">
          <p className="font-semibold uppercase tracking-widest text-foreground">Unlock requirement</p>
          <p className="mt-1">{describeRequirement(a)}</p>
          {a.xp_bonus > 0 && (
            <p className="mt-2 text-primary">Bonus reward: +{a.xp_bonus} XP (arriving soon)</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function humanize(v: string) {
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function describeRequirement(a: { unlock_type: string; unlock_requirement: unknown; goal_target: number }) {
  const req = (a.unlock_requirement ?? {}) as Record<string, unknown>;
  switch (a.unlock_type) {
    case "level_reached":
      return `Reach Level ${req.level ?? a.goal_target}.`;
    case "quests_completed":
      return `Complete ${req.count ?? a.goal_target} quests.`;
    case "specific_quest":
      return `Complete the "${req.quest_slug ?? "specified"}" quest.`;
    case "title_earned":
      return `Earn the "${req.title_slug ?? "specified"}" title.`;
    case "pioneer":
      return "Be one of the first 25 SideQuest pioneers.";
    case "founder":
      return "Reserved for the SideQuest founder.";
    case "manual":
      return "Assigned by the SideQuest team.";
    default:
      return "Special conditions apply.";
  }
}