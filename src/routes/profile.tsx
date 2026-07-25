import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Settings } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { useMyProgress, useMyXpHistory } from "@/lib/hooks/useProgression";
import { XpBar } from "@/components/progression/XpBar";
import { useEquippedTitle, useMyTitles } from "@/lib/hooks/useTitles";
import { TitleBadge } from "@/components/titles/TitleBadge";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — SideQuest" },
      { name: "description", content: "Your SideQuest explorer profile." },
      { property: "og:title", content: "Your profile — SideQuest" },
      { property: "og:description", content: "Your SideQuest explorer profile." },
    ],
  }),
  component: () => (<AuthGate><ProfileInner /></AuthGate>),
});

function ProfileInner() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: progress } = useMyProgress(!!user);
  const { data: recentXp } = useMyXpHistory(8, !!user);
  const { data: equipped } = useEquippedTitle(!!user);
  const { data: myTitles } = useMyTitles(!!user);
  const p = profile ?? {
    display_name: user?.user_metadata?.full_name || user?.user_metadata?.name || "Explorer",
    username: "explorer",
    avatar_url: (user?.user_metadata?.avatar_url as string | undefined) ?? null,
    is_pioneer: false,
    pioneer_number: null as number | null,
    city: "Ankleshwar",
    level: 1,
    xp: 0,
  };
  const level = progress?.current_level ?? p.level;
  const lifetimeXp = progress?.lifetime_xp ?? p.xp;
  const currentLevelXp = progress?.current_level_xp ?? 0;
  const xpForNext = progress?.xp_for_next_level ?? 100;
  const xpRemaining = Math.max(0, xpForNext - currentLevelXp);
  const questsDone = progress?.total_quests_completed ?? 0;
  const initials = (p.display_name || "SQ").split(/\s+/).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join("");
  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Profile</h1>
        <Link to="/settings" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/60 text-muted-foreground">
          <Settings className="h-4 w-4" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-3xl border border-border bg-card/70 p-6 text-center backdrop-blur"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <Avatar className="mx-auto h-24 w-24 border-2 border-primary/40">
          {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.display_name} />}
          <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">{initials}</AvatarFallback>
        </Avatar>
        <h2 className="mt-3 text-xl font-bold">{p.display_name}</h2>
        <p className="text-sm text-muted-foreground">@{p.username}</p>
        {p.is_pioneer && (
          <span
            className="mt-3 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              borderColor: "oklch(0.85 0.16 85 / 0.5)",
              backgroundColor: "oklch(0.85 0.16 85 / 0.12)",
              color: "oklch(0.85 0.16 85)",
            }}
          >
            🏆 Pioneer{p.pioneer_number ? ` #${p.pioneer_number}` : ""}
          </span>
        )}
        {equipped?.titles && (
          <div className="mt-3 flex justify-center">
            <Link to="/titles">
              <TitleBadge
                name={equipped.titles.name}
                icon={equipped.titles.icon}
                rarity={equipped.titles.rarity}
                color={equipped.titles.color}
                size="md"
              />
            </Link>
          </div>
        )}
        <div className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 text-primary" /> {p.city}
        </div>
      </motion.div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Stat label="Level" value={String(level)} />
        <Stat label="Lifetime XP" value={String(lifetimeXp)} />
        <Stat label="Quests" value={String(questsDone)} />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 rounded-3xl border border-border bg-card/70 p-5 backdrop-blur"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Progression</h3>
          <Link to="/xp-history" className="text-xs font-semibold text-primary">History →</Link>
        </div>
        <XpBar
          level={level}
          currentLevelXp={currentLevelXp}
          xpForNextLevel={xpForNext}
          variant="onLight"
          className="mt-3"
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          {xpRemaining} XP to Level {level + 1}
          {progress?.level_up_date ? ` · last level up ${new Date(progress.level_up_date).toLocaleDateString()}` : ""}
        </p>
      </motion.section>

      <section className="mt-5 rounded-3xl border border-border bg-card/70 p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Titles</h3>
          <Link to="/titles" className="text-xs font-semibold text-primary">Manage →</Link>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {(myTitles?.length ?? 0)} unlocked · equip one to show off your progress.
        </p>
        {(myTitles?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(myTitles ?? []).slice(0, 6).map((pt) => (
              <TitleBadge
                key={pt.id}
                name={pt.titles.name}
                icon={pt.titles.icon}
                rarity={pt.titles.rarity}
                color={pt.titles.color}
              />
            ))}
          </div>
        )}
      </section>

      {recentXp && recentXp.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent activity</h3>
          <div className="space-y-2">
            {recentXp.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{e.quests?.title ?? "Bonus XP"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString()} · {e.reason.replace(/_/g, " ")}
                  </p>
                </div>
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                  +{e.xp_earned} XP
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}