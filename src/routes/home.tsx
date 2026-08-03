import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, Bell, Compass, FlaskConical, Gift, MapPin, Sparkles, Star, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { ProfileMenu } from "@/components/home/ProfileMenu";
import { WelcomePopup } from "@/components/home/WelcomePopup";
import { PushPrompt } from "@/components/push/PushPrompt";
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
import { LiveOpsRail } from "@/components/home/LiveOpsRail";
import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { useUnreadNotifCount } from "@/lib/hooks/useLiveOps";
import { Reveal } from "@/components/motion/Reveal";
import { StaggerList } from "@/components/motion/StaggerList";
import { CountUp } from "@/components/motion/CountUp";
import { heroReveal } from "@/lib/motion";

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
  const { data: unread } = useUnreadNotifCount(!!user);
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
      <PushPrompt userId={user?.id} />
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Welcome back</p>
          <h1 className="text-blaze text-3xl font-bold tracking-tight">{p.display_name}</h1>
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

      <div className="mt-3 flex items-center gap-2">
        <Link to="/notifications" className="relative inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground active:scale-95">
          <Bell className="h-3.5 w-3.5" /> Inbox
          {unread && unread.count > 0 && (
            <span className="neon-primary absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{unread.count}</span>
          )}
        </Link>
        <Link to="/events" className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground active:scale-95">Events</Link>
        <Link to="/challenges" className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground active:scale-95">Challenges</Link>
      </div>

      <AnnouncementBanner />

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
        className="relative mt-5 overflow-hidden rounded-3xl border border-white/10 p-5"
        style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elevated)" }}
        variants={heroReveal}
        initial="hidden"
        animate="show"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0 0 0 / 0.25) 1px, transparent 1px), linear-gradient(90deg, oklch(0 0 0 / 0.25) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex items-center justify-between text-primary-foreground">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">Explorer rank</p>
            <p className="font-display text-3xl font-bold leading-none">Lv {p.level}</p>
          </div>
          <div className="rounded-2xl bg-black/25 px-3 py-2 text-right backdrop-blur">
            <CountUp value={lifetimeXp} className="block text-xl font-bold tabular-nums" />
            <span className="text-[9px] uppercase tracking-[0.2em] opacity-80">total xp</span>
          </div>
        </div>
        <XpBar
          level={p.level}
          currentLevelXp={currentLevelXp}
          xpForNextLevel={xpForNext}
          className="relative mt-4"
        />
        <p className="relative mt-2 text-[11px] font-medium text-primary-foreground/85">
          {Math.max(0, xpForNext - currentLevelXp)} XP to level {p.level + 1}
        </p>
      </motion.section>

      <LiveOpsRail />

      <StaggerList as="div" className="mt-5 grid grid-cols-2 gap-3">
        <StatCard icon={<Sparkles className="h-5 w-5 text-primary" />} label="Level" value={p.level} />
        <StatCard icon={<Star className="h-5 w-5 text-accent" />} label="XP" value={lifetimeXp} />
        <StatCard icon={<Compass className="h-5 w-5 text-primary" />} label="Quests" value={questsDone} />
        <Link to="/achievements" className="block">
          <StatCard icon={<Award className="h-5 w-5 text-accent" />} label="Badges" value={badgeCount} />
        </Link>
      </StaggerList>

      <Reveal className="mt-6">
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
            {showcase.map((row, i) => {
              const s = RARITY_STYLES[row.achievements.rarity] ?? RARITY_STYLES.common;
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i, type: "spring", stiffness: 320, damping: 20 }}
                >
                <Link
                  to="/achievements/$slug"
                  params={{ slug: row.achievements.slug }}
                  className={`badge-shimmer grid aspect-square place-items-center rounded-2xl border text-3xl backdrop-blur transition-transform duration-200 hover:scale-105 active:scale-95 ${s.ring}`}
                  style={{ background: s.bg, boxShadow: s.glow }}
                  aria-label={row.achievements.name}
                >
                  {row.achievements.icon}
                </Link>
                </motion.div>
              );
            })}
          </div>
        )}
        {latestBadge && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Latest: <span className="text-foreground">{latestBadge.achievements.name}</span>
          </p>
        )}
      </Reveal>

      {recentXp && recentXp.length > 0 && (
        <Reveal className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent XP</h2>
            <Link to="/xp-history" className="text-xs font-semibold text-primary">View all</Link>
          </div>
          <StaggerList as="div" className="space-y-2">
            {recentXp.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3 backdrop-blur transition-colors duration-200 hover:border-primary/40">
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
          </StaggerList>
        </Reveal>
      )}

      <Reveal className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Explore</h2>
        <StaggerList as="div" className="grid grid-cols-2 gap-3">
          <QuickLink to="/quests" icon={<Compass className="h-5 w-5" />} title="Quests" desc="Adventures across Ankleshwar." />
          <QuickLink to="/leaderboard" icon={<Trophy className="h-5 w-5" />} title="Leaderboard" desc="Climb the city ranks." />
          <QuickLink to="/collections" icon={<Award className="h-5 w-5" />} title="Collections" desc="Complete themed sets." />
          <QuickLink to="/players" icon={<Users className="h-5 w-5" />} title="Players" desc="Meet fellow explorers." />
        </StaggerList>
      </Reveal>

      <Reveal className="mt-6">
        <div className="card-shine relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-primary/10 to-transparent p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent">
              <Gift className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Real-life prizes</p>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent">Coming soon</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Redeem your XP for real-world rewards from local partners in Ankleshwar. Keep questing — you'll be first in line.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </AppShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className="hud-panel hud-edge rounded-2xl p-3.5 transition-colors duration-200 hover:border-primary/40"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 ring-1 ring-primary/20">{icon}</div>
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <CountUp value={value} className="font-display text-2xl font-bold tabular-nums" />
    </motion.div>
  );
}

function QuickLink({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="hud-panel hud-edge group flex flex-col gap-2 rounded-2xl p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 active:scale-[0.98]"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3">{icon}</div>
      <div>
        <p className="font-display text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}