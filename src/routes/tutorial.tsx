import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useEffect, useState } from "react";
import { Map, Target, TrendingUp, Award } from "lucide-react";
import { ScreenShell } from "@/components/onboarding/ScreenShell";
import { ProgressDots } from "@/components/onboarding/ProgressDots";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile, usePioneerSlots } from "@/lib/hooks/useProfile";

export const Route = createFileRoute("/tutorial")({
  head: () => ({
    meta: [
      { title: "How to play — SideQuest" },
      { name: "description", content: "Learn the basics of SideQuest before you start exploring." },
      { property: "og:title", content: "How to play — SideQuest" },
      { property: "og:description", content: "Learn the basics of SideQuest before you start exploring." },
    ],
  }),
  component: Tutorial,
});

function Tutorial() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: slotsLeft } = usePioneerSlots();
  const [step, setStep] = useState(0);
  const total = 5; // welcome + 4 tutorials

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const next = () => (step < total - 1 ? setStep(step + 1) : navigate({ to: "/starter" }));
  const back = () => setStep((v) => Math.max(0, v - 1));
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) back();
  };

  return (
    <ScreenShell className="justify-between">
      <div className="flex items-center justify-between">
        <button onClick={back} disabled={step === 0} className="text-sm text-muted-foreground disabled:opacity-30">Back</button>
        <button onClick={() => navigate({ to: "/starter" })} className="text-sm font-medium text-muted-foreground">Skip</button>
      </div>

      <div className="flex flex-1 items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {step === 0 && (
              <WelcomeCard name={profile?.display_name || "Explorer"} pioneer={!!profile?.is_pioneer} slotsLeft={slotsLeft} />
            )}
            {step === 1 && <TutorialCard icon={Map} title="🗺️ Explore Your City" desc="Walk around your city and discover exciting locations waiting to become your next adventure." />}
            {step === 2 && <TutorialCard icon={Target} title="🎯 Complete Missions" desc="Each quest has its own story, challenge and reward. Complete them to earn XP and unlock more adventures." />}
            {step === 3 && <XPDemoCard />}
            {step === 4 && <LegendCard />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        <ProgressDots total={total} index={step} />
        <Button size="lg" className="h-14 w-full text-base font-semibold" onClick={next}>
          {step === total - 1 ? "Claim starter rewards" : "Next"}
        </Button>
      </div>
    </ScreenShell>
  );
}

function WelcomeCard({ name, pioneer, slotsLeft }: { name: string; pioneer: boolean; slotsLeft?: number }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Welcome, {name}!</h2>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Your adventure begins today. Explore your city, complete quests, earn rewards and become one of the top explorers.
      </p>
      {pioneer && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
          🏅 Pioneer Status Reserved
        </div>
      )}
      {!pioneer && typeof slotsLeft === "number" && slotsLeft > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">{slotsLeft} Pioneer slots remaining</p>
      )}
    </div>
  );
}

function TutorialCard({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="grid h-52 w-52 place-items-center rounded-[2rem] border border-border bg-gradient-to-br from-primary/25 to-primary/5 backdrop-blur" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <Icon className="h-24 w-24 text-primary" strokeWidth={1.4} />
      </div>
      <h2 className="mt-8 text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function XPDemoCard() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="grid h-40 w-52 place-items-center rounded-[2rem] border border-border bg-gradient-to-br from-accent/25 to-accent/5 backdrop-blur" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <TrendingUp className="h-20 w-20 text-accent" strokeWidth={1.4} />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight">🏆 Earn XP & Level Up</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Every completed quest earns XP. Level up to unlock achievements, badges and future adventures.
      </p>
      <div className="mt-6 w-full max-w-xs">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold">Level 1</span>
          <span className="text-muted-foreground">120 / 200 XP</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "60%" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: "var(--gradient-hero)" }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Demo only — your real XP starts at 0.</p>
      </div>
    </div>
  );
}

function LegendCard() {
  const badges = [
    { emoji: "🗺️", name: "Trailblazer" },
    { emoji: "🌉", name: "Bridge Keeper" },
    { emoji: "🕌", name: "Heritage" },
  ];
  return (
    <div className="flex flex-col items-center text-center">
      <div className="grid h-40 w-52 place-items-center rounded-[2rem] border border-border bg-gradient-to-br from-primary/25 to-accent/15 backdrop-blur" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <Award className="h-20 w-20 text-accent" strokeWidth={1.4} />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight">🥇 Become a Legend</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Compete on city leaderboards, collect hidden badges and become one of SideQuest's greatest explorers.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-2">
        {badges.map((b) => (
          <div key={b.name} className="rounded-2xl border border-border bg-card/70 p-3 backdrop-blur">
            <div className="text-2xl">{b.emoji}</div>
            <p className="mt-1 text-[10px] font-medium text-muted-foreground">{b.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}