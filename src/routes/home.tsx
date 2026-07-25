import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, Bell, CalendarDays, Compass, FlaskConical, MapPin, Sparkles, Star, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { ProfileMenu } from "@/components/home/ProfileMenu";
import { WelcomePopup } from "@/components/home/WelcomePopup";
import { PioneerCelebration } from "@/components/home/PioneerCelebration";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { useMyProgress, useMyXpHistory } from "@/lib/hooks/useProgression";
import { XpBar } from "@/components/progression/XpBar";
import { Link } from "@tanstack/react-router";
import { useEquippedTitle } from "@/lib/hooks/useTitles";
import { TitleBadge } from "@/components/titles/TitleBadge";
import { useMyAchievements } from "@/lib/hooks/useAchievements";
import { RARITY_STYLES } from "@/lib/hooks/useTitles";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — SideQuest" },
      { name: "description", content: "Your explorer dashboard for SideQuest Ankleshwar." },
      { property: "og:title", content: "Home — SideQuest" },
      { property: "og:description", content: "Your explorer dashboard for SideQuest Ankleshwar." },
    ],
  }),
  component: () => (<AuthGate><HomeInner /></AuthGate>),
});

function HomeInner() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: progress } = useMyProgress(!!user);
  const { data: recentXp } = useMyXpHistory(5, !!user);
  const { data: equipped } = useEquippedTitle(!!user);
  const { data: myAch } = useMyAchievements(!!user);
  const unlockedAch = (myAch ?? []).filter((r) => r.completed);
  const featured = unlockedAch.filter((r) => r.featured).sort((a, b) => b.featured_order - a.featured_order);
  const showcase = (featured.length > 0 ? featured : unlockedAch).slice(0, 4);
  const badgeCount = unlockedAch.length;
  const latestBadge = unlockedAch[0];
  // Home must render even if some optional profile fields are missing.
  const displayName = profile?.display_name?.trim() || user?.email?.split("@")[0] || "Explorer";
  const username = profile?.username || (user?.email?.split("@")[0] ?? "explorer");
  const city = profile?.city || "Ankleshwar";
  const level = progress?.current_level ?? profile?.level ?? 1;
  const lifetimeXp = progress?.lifetime_xp ?? profile?.xp ?? 0;
  const currentLevelXp = progress?.current_level_xp ?? 0;
  const xpForNext = progress?.xp_for_next_level ?? 100;
  const questsDone = progress?.total_quests_completed ?? 0;
  const avatarUrl = profile?.avatar_url ?? null;
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "SQ";
  const p = { display_name: displayName, city, level, xp: lifetimeXp, avatar_url: avatarUrl };

  return (
    <AppShell>
      <PioneerCelebration userId={user?.id} pioneerNumber={profile?.pioneer_number ?? null} />
      <WelcomePopup userId={user?.id} />
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl font-bold tracking-tight">{p.display_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> {p.city}</span>
            {equipped?.titles && (
              <Link to="/titles" aria-label="Change title">
                <TitleBadge
                  name={equipped.titles.name}
                  icon={equipped.titles.icon}
                  rarity={equipped.titles.rarity}
                  color={equipped.titles.color}
                />
              </Link>
            )}
          </div>
        </div>
        <ProfileMenu
          displayName={p.display_name}
          username={username}
          email={user?.email}
          avatarUrl={p.avatar_url}
          initials={initials}
        />
      </header>

      <motion.div
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <FlaskConical className="h-3.5 w-3.5" />
        <span>🧪 Beta Tester</span>
        <span className="font-normal text-muted-foreground">· Thanks for helping build SideQuest.</span>
      </motion.div>

      <motion.section
        className="mt-5 overflow-hidden rounded-3xl border border-border p-5"
        style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elevated)" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between text-primary-foreground">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Explorer</p>
            <p className="text-lg font-bold">Level {p.level}</p>
          </div>
          <p className="text-sm opacity-90">{lifetimeXp} total XP</p>
        </div>
        <XpBar
          level={p.level}
          currentLevelXp={currentLevelXp}
          xpForNextLevel={xpForNext}
          className="mt-3"
        />
      </motion.section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <StatCard icon={<Sparkles className="h-5 w-5 text-primary" />} label="Level" value={String(p.level)} />
        <StatCard icon={<Star className="h-5 w-5 text-accent" />} label="XP" value={String(lifetimeXp)} />
        <StatCard icon={<Compass className="h-5 w-5 text-primary" />} label="Quests" value={String(questsDone)} />
        <Link to="/achievements" className="block">
          <StatCard icon={<Award className="h-5 w-5 text-accent" />} label="Badges" value={String(badgeCount)} />
        </Link>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Badge showcase</h2>
          <Link to="/achievements" className="text-xs font-semibold text-primary">View all</Link>
        </div>
        {showcase.length === 0 ? (
          <Link to="/achievements" className="block rounded-2xl border border-dashed border-border bg-card/40 p-4 text-center text-xs text-muted-foreground backdrop-blur">
            Complete your first quest to earn a badge.
          </Link>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {showcase.map((row) => {
              const s = RARITY_STYLES[row.achievements.rarity] ?? RARITY_STYLES.common;
              return (
                <Link
                  key={row.id}
                  to="/achievements/$slug"
                  params={{ slug: row.achievements.slug }}
                  className={`grid aspect-square place-items-center rounded-2xl border text-3xl backdrop-blur active:scale-95 ${s.ring}`}
                  style={{ background: s.bg, boxShadow: s.glow }}
                  aria-label={row.achievements.name}
                >
                  {row.achievements.icon}
                </Link>
              );
            })}
          </div>
        )}
        {latestBadge && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Latest: <span className="text-foreground">{latestBadge.achievements.name}</span>
          </p>
        )}
      </section>

      {recentXp && recentXp.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent XP</h2>
            <Link to="/xp-history" className="text-xs font-semibold text-primary">View all</Link>
          </div>
          <div className="space-y-2">
            {recentXp.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3 backdrop-blur">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {e.quests?.title ?? "Bonus"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()} · {e.reason.replace(/_/g, " ")}
                  </p>
                </div>
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">+{e.xp_earned} XP</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Coming soon</h2>
        <div className="space-y-3">
          <ComingSoon icon={<Compass className="h-5 w-5" />} title="Quests" desc="Curated adventures across Ankleshwar — puzzles, photo hunts and QR check-ins." />
          <ComingSoon icon={<Trophy className="h-5 w-5" />} title="Leaderboard" desc="Race to the top of the city ranks each week." />
          <ComingSoon icon={<Award className="h-5 w-5" />} title="Collection" desc="Track every badge you earn along the way." />
          <ComingSoon icon={<CalendarDays className="h-5 w-5" />} title="Weekly Quest" desc="One special mission every week with bonus rewards." />
          <ComingSoon icon={<Bell className="h-5 w-5" />} title="Announcements" desc="Community events, new drops and city-wide challenges." />
        </div>
      </section>
    </AppShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl border border-border bg-card/70 p-3.5 backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10">{icon}</div>
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </motion.div>
  );
}

function ComingSoon({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-3.5 backdrop-blur">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">Soon</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}