import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { ArrowLeft, CalendarDays, Compass, Loader2, Sparkles, TrendingUp, Users } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { useAuth } from "@/lib/hooks/useAuth";
import { getFounderStats, type FounderUserRow } from "@/lib/founder.functions";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";

export const Route = createFileRoute("/founder")({
  head: () => ({
    meta: [
      { title: "Founder Dashboard — SideQuest" },
      { name: "description", content: "Private founder overview for SideQuest." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AuthGate>
      <FounderPage />
    </AuthGate>
  ),
});

function FounderPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL;

  useEffect(() => {
    if (loading) return;
    if (!isFounder) navigate({ to: "/home" });
  }, [loading, isFounder, navigate]);

  const fetchStats = useServerFn(getFounderStats);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["founder-stats"],
    enabled: isFounder,
    queryFn: () => fetchStats(),
    refetchOnWindowFocus: false,
  });

  if (!isFounder) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pioneerPct = data ? Math.min(100, (data.pioneers / data.pioneerTarget) * 100) : 0;

  return (
    <div
      className="relative min-h-[100dvh] bg-background text-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto max-w-3xl px-5 pb-16 pt-4">
        <header className="flex items-center justify-between">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <button
            onClick={() => refetch()}
            className="text-xs font-medium text-primary hover:underline"
          >
            Refresh
          </button>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Founder</p>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live overview of the SideQuest beta.</p>
        </motion.div>

        {isLoading && (
          <div className="mt-10 grid place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Couldn't load stats. Try refreshing.
          </div>
        )}

        {data && (
          <>
            <section className="mt-6 grid grid-cols-2 gap-3">
              <Link
                to="/founder/quests"
                className="col-span-2 flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 p-4 shadow-md transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-primary">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-primary">Quest Studio</p>
                    <p className="text-sm font-semibold text-foreground">Create & manage quests</p>
                  </div>
                </div>
                <span className="text-lg text-primary">→</span>
              </Link>
              <StatCard
                icon={<Users className="h-5 w-5 text-primary" />}
                label="Total users"
                value={String(data.total)}
                emoji="👥"
              />
              <StatCard
                icon={<Sparkles className="h-5 w-5 text-accent" />}
                label={`Pioneers (${data.pioneers}/${data.pioneerTarget})`}
                value={String(data.pioneers)}
                emoji="🏆"
              />
              <StatCard
                icon={<CalendarDays className="h-5 w-5 text-primary" />}
                label="New today"
                value={String(data.today)}
                emoji="📅"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-accent" />}
                label="New this week"
                value={String(data.thisWeek)}
                emoji="📈"
              />
            </section>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-3xl border border-border bg-card/70 p-5 backdrop-blur"
              style={{ boxShadow: "var(--shadow-elevated)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Pioneer progress</p>
                  <p className="text-lg font-bold">
                    {data.pioneers} / {data.pioneerTarget} Claimed
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(pioneerPct)}%</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pioneerPct}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-primary"
                />
              </div>
            </motion.section>

            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Recent users
              </h2>
              <div className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur">
                <div className="hidden grid-cols-[1.4fr_1fr_1.4fr_1fr_0.6fr] gap-3 border-b border-border px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground sm:grid">
                  <span>Display name</span>
                  <span>Username</span>
                  <span>Email</span>
                  <span>Joined</span>
                  <span className="text-right">Pioneer</span>
                </div>
                <ul className="divide-y divide-border">
                  {data.recent.length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-muted-foreground">No users yet.</li>
                  )}
                  {data.recent.map((u: FounderUserRow) => (
                    <li
                      key={u.id}
                      className="grid grid-cols-1 gap-1 px-4 py-3 text-sm sm:grid-cols-[1.4fr_1fr_1.4fr_1fr_0.6fr] sm:items-center sm:gap-3"
                    >
                      <span className="truncate font-medium">{u.display_name}</span>
                      <span className="truncate text-muted-foreground">@{u.username}</span>
                      <span className="truncate text-muted-foreground">{u.email ?? "—"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleString()}
                      </span>
                      <span className="sm:text-right">
                        {u.is_pioneer ? (
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor: "oklch(0.85 0.16 85 / 0.15)",
                              color: "oklch(0.85 0.16 85)",
                            }}
                          >
                            #{u.pioneer_number ?? "—"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">No</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  emoji,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10">{icon}</div>
        <span aria-hidden className="text-lg">{emoji}</span>
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </motion.div>
  );
}