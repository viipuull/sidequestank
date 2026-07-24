import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useState } from "react";
import { Compass, Map, Trophy } from "lucide-react";
import { ScreenShell } from "@/components/onboarding/ScreenShell";
import { ProgressDots } from "@/components/onboarding/ProgressDots";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "How SideQuest works" },
      { name: "description", content: "Discover, explore and level up in your city." },
      { property: "og:title", content: "How SideQuest works" },
      { property: "og:description", content: "Discover, explore and level up in your city." },
    ],
  }),
  component: Onboarding,
});

const SLIDES = [
  {
    icon: Map,
    title: "Explore Hidden Places",
    desc: "Discover landmarks, local gems, hidden spots and exciting places around your city through fun real-world adventures.",
    tone: "from-primary/25 to-primary/5",
  },
  {
    icon: Compass,
    title: "Complete Real Quests",
    desc: "Solve puzzles, answer questions, visit locations, scan QR codes and complete unique challenges to earn rewards.",
    tone: "from-accent/25 to-accent/5",
  },
  {
    icon: Trophy,
    title: "Level Up Your Adventure",
    desc: "Earn XP, unlock hidden badges, compete with friends and become one of the city's greatest explorers.",
    tone: "from-primary/25 to-accent/10",
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const Icon = slide.icon;

  const next = () => (i < SLIDES.length - 1 ? setI(i + 1) : navigate({ to: "/rules" }));
  const back = () => setI((v) => Math.max(0, v - 1));
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) back();
  };

  return (
    <ScreenShell className="justify-between">
      <div className="flex items-center justify-between">
        <button
          onClick={back}
          disabled={i === 0}
          className="text-sm text-muted-foreground disabled:opacity-30"
        >
          Back
        </button>
        <button
          onClick={() => navigate({ to: "/rules" })}
          className="text-sm font-medium text-muted-foreground"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex w-full flex-col items-center text-center"
          >
            <div
              className={`grid h-56 w-56 place-items-center rounded-[2rem] border border-border bg-gradient-to-br ${slide.tone} backdrop-blur`}
              style={{ boxShadow: "var(--shadow-elevated)" }}
            >
              <motion.div
                initial={{ scale: 0.7, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
              >
                <Icon className="h-24 w-24 text-primary" strokeWidth={1.4} />
              </motion.div>
            </div>
            <h2 className="mt-8 text-2xl font-bold tracking-tight">{slide.title}</h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {slide.desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        <ProgressDots total={SLIDES.length} index={i} />
        <Button size="lg" className="h-14 w-full text-base font-semibold" onClick={next}>
          {i === SLIDES.length - 1 ? "Continue" : "Next"}
        </Button>
      </div>
    </ScreenShell>
  );
}