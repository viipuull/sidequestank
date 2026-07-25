import { Link } from "@tanstack/react-router";
import { Flame, Target } from "lucide-react";
import { useLiveEvents, useMyChallenges } from "@/lib/hooks/useLiveOps";

export function LiveOpsRail() {
  const { data: events } = useLiveEvents("live");
  const { data: chData } = useMyChallenges();
  const liveEvents = (events ?? []).slice(0, 5);
  const daily = (chData?.challenges ?? []).filter((c) => c.reset_frequency === "daily").slice(0, 3);
  const progMap = new Map((chData?.progress ?? []).map((p) => [p.challenge_id, p]));

  if (liveEvents.length === 0 && daily.length === 0) return null;

  return (
    <section className="mt-5">
      {liveEvents.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-primary" /> Live now
            </h2>
            <Link to="/events" className="text-xs font-semibold text-primary">All events</Link>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {liveEvents.map((e) => (
              <Link key={e.id} to="/events/$slug" params={{ slug: e.slug }}
                className="snap-start min-w-[75%] rounded-2xl border border-primary/30 bg-primary/10 p-4 backdrop-blur active:scale-[0.99]">
                <div className="flex items-center gap-2 text-2xl">{e.icon}
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold uppercase text-primary">LIVE</span>
                </div>
                <p className="mt-2 text-sm font-bold">{e.name}</p>
                {e.ends_at && <p className="text-[10px] text-muted-foreground">Ends {new Date(e.ends_at).toLocaleDateString()}</p>}
              </Link>
            ))}
          </div>
        </>
      )}

      {daily.length > 0 && (
        <>
          <div className="mb-2 mt-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-accent" /> Today's challenges
            </h2>
            <Link to="/challenges" className="text-xs font-semibold text-primary">All</Link>
          </div>
          <div className="space-y-2">
            {daily.map((c) => {
              const p = progMap.get(c.id);
              const cur = p?.progress ?? 0;
              const pct = Math.min(100, Math.round((cur / c.target) * 100));
              const done = p?.completed;
              return (
                <Link key={c.id} to="/challenges" className="block rounded-2xl border border-border bg-card/70 p-3 backdrop-blur active:scale-[0.99]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{c.icon} {c.name}</p>
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">+{c.reward_xp}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{cur}/{c.target}{done ? " · done" : ""}</p>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}