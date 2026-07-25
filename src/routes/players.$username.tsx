import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, ArrowLeft, MapPin, Sparkles, Trophy, Users, Layers, Compass } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { PlayerAvatar } from "@/components/social/PlayerAvatar";
import { ActivityItem } from "@/components/social/ActivityItem";
import { getPublicProfile } from "@/lib/social.functions";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";

export const Route = createFileRoute("/players/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — SideQuest` },
      { name: "description", content: `See ${params.username}'s SideQuest journey — quests, titles, badges, and rank.` },
      { property: "og:title", content: `@${params.username} on SideQuest` },
      { property: "og:description", content: `Explorer profile of @${params.username}.` },
    ],
  }),
  component: () => (
    <AuthGate>
      <PublicProfilePage />
    </AuthGate>
  ),
});

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3 text-center">
      <div className="mx-auto mb-1 grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function PublicProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const { data: me } = useProfile(user?.id);
  const navigate = useNavigate();
  const fetch = useServerFn(getPublicProfile);
  const q = useQuery({ queryKey: ["public-profile", username], queryFn: () => fetch({ data: { username } }) });

  if (q.isLoading) return <AppShell><div className="mt-20 text-center text-muted-foreground">Loading profile…</div></AppShell>;
  if (!q.data) return (
    <AppShell>
      <div className="mt-20 text-center">
        <p className="text-sm text-muted-foreground">This profile isn't available.</p>
        <button onClick={() => navigate({ to: "/players" })} className="mt-4 text-sm text-primary hover:underline">Back to Discover</button>
      </div>
    </AppShell>
  );

  const { profile, settings, stats, equipped_title, featured_badges, recent_activity, global_rank, city_rank } = q.data;
  const showXp = settings.show_xp && settings.show_stats;
  const showLvl = settings.show_level && settings.show_stats;

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <Link to="/players" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Discover</Link>
        {me && me.username.toLowerCase() !== profile.username.toLowerCase() && (
          <Link to="/players/$username/compare" params={{ username: profile.username }} className="text-xs font-medium text-primary hover:underline">Compare ↔</Link>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-3xl border border-border bg-gradient-to-br from-primary/15 to-accent/10 p-5">
        <div className="flex items-center gap-4">
          <PlayerAvatar url={profile.avatar_url} name={profile.display_name} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold">{profile.display_name}</h1>
            <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {equipped_title && settings.show_titles && (
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium" style={{ borderColor: `${equipped_title.color}55`, color: equipped_title.color }}>
                  {equipped_title.name}
                </span>
              )}
              {profile.is_pioneer && profile.pioneer_number && (
                <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[10px] text-amber-200">Pioneer #{profile.pioneer_number}</span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />{profile.city || "—"}</span>
            </div>
          </div>
        </div>
        {settings.bio && <p className="mt-3 text-sm text-muted-foreground">{settings.bio}</p>}
      </motion.div>

      {settings.show_stats && (
        <section className="mt-5 grid grid-cols-3 gap-2">
          {showLvl && <Stat icon={<Sparkles className="h-4 w-4" />} label="Level" value={stats?.level ?? profile.level ?? 1} />}
          {showXp && <Stat icon={<Sparkles className="h-4 w-4" />} label="XP" value={(stats?.total_xp ?? profile.xp ?? 0).toLocaleString()} />}
          <Stat icon={<Compass className="h-4 w-4" />} label="Quests" value={stats?.quests_completed ?? 0} />
          <Stat icon={<Layers className="h-4 w-4" />} label="Collections" value={stats?.collections_completed ?? 0} />
          <Stat icon={<Award className="h-4 w-4" />} label="Badges" value={stats?.achievements_earned ?? 0} />
          <Stat icon={<Trophy className="h-4 w-4" />} label="Titles" value={stats?.titles_earned ?? 0} />
        </section>
      )}

      <section className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border bg-card/60 p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Global rank</p>
          <p className="text-xl font-bold text-primary">{global_rank ? `#${global_rank}` : "—"}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{profile.city || "City"} rank</p>
          <p className="text-xl font-bold text-accent">{city_rank ? `#${city_rank}` : "—"}</p>
        </div>
      </section>

      {settings.show_achievements && featured_badges.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Featured Badges</h2>
          <div className="grid grid-cols-3 gap-2">
            {featured_badges.map((b) => (
              <div key={b.id} className="rounded-2xl border border-border bg-card/60 p-3 text-center">
                {b.badge_image_url ? (
                  <img src={b.badge_image_url} alt={b.name} className="mx-auto h-12 w-12 object-contain" />
                ) : (
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full text-2xl" style={{ backgroundColor: `${b.color}22`, color: b.color }}>{b.icon || "🏅"}</div>
                )}
                <p className="mt-1 line-clamp-1 text-[11px] font-medium">{b.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-5">
        <div className="mb-2 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground">Recent activity</h2>
        </div>
        <div className="space-y-2">
          {recent_activity.length === 0 && <p className="text-xs text-muted-foreground">No public activity yet.</p>}
          {recent_activity.map((a) => (
            <ActivityItem key={a.id} item={{ ...a, profile: { username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url, city: profile.city } }} />
          ))}
        </div>
      </section>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
    </AppShell>
  );
}
