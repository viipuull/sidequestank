import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, MapPin, Sparkles, Star, Trophy } from "lucide-react";
import { ScreenShell } from "@/components/onboarding/ScreenShell";
import { Button } from "@/components/ui/button";
import { onboarding } from "@/lib/hooks/useOnboarding";

export const Route = createFileRoute("/starter")({
  head: () => ({
    meta: [
      { title: "Starter Rewards — SideQuest" },
      { name: "description", content: "Claim your welcome pack and start exploring Ankleshwar." },
      { property: "og:title", content: "Starter Rewards — SideQuest" },
      { property: "og:description", content: "Claim your welcome pack and start exploring Ankleshwar." },
    ],
  }),
  component: Starter,
});

const TIPS = [
  "Stay aware of your surroundings.",
  "Respect public places.",
  "Some quests require careful observation.",
  "New quests arrive regularly — check back often.",
];

function Starter() {
  const navigate = useNavigate();
  const [tipsOpen, setTipsOpen] = useState(false);

  const finish = () => {
    onboarding.setTutorialDone();
    navigate({ to: "/home" });
  };

  return (
    <ScreenShell>
      <motion.div
        className="mt-2 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-5xl">🎁</div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Starter Rewards</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything you need to begin.</p>
      </motion.div>

      <motion.div
        className="my-6 grid grid-cols-2 gap-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        <RewardCard icon={<Sparkles className="h-6 w-6 text-primary" />} label="Explorer" value="Level 1" />
        <RewardCard icon={<Star className="h-6 w-6 text-accent" />} label="Experience" value="0 XP" />
        <RewardCard icon={<Trophy className="h-6 w-6 text-accent" />} label="Badge" value="Adventure Begins" wide />
        <RewardCard icon={<MapPin className="h-6 w-6 text-primary" />} label="Home city" value="Ankleshwar" wide />
      </motion.div>

      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
        <p className="text-sm font-semibold">Only a handful of explorers will discover every hidden quest.</p>
        <p className="mt-1 text-sm text-muted-foreground">Will you become one of them?</p>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card/60">
        <button
          onClick={() => setTipsOpen((v) => !v)}
          className="flex w-full items-center justify-between p-4"
        >
          <span className="text-sm font-semibold">Helpful Tips</span>
          <motion.span animate={{ rotate: tipsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.span>
        </button>
        <motion.div
          initial={false}
          animate={{ height: tipsOpen ? "auto" : 0, opacity: tipsOpen ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <ul className="space-y-1.5 px-4 pb-4 text-sm text-muted-foreground">
            {TIPS.map((t) => (
              <li key={t} className="flex gap-2"><span className="text-primary">•</span>{t}</li>
            ))}
          </ul>
        </motion.div>
      </div>

      <div className="mt-auto pt-6">
        <Button size="lg" className="h-14 w-full text-base font-semibold" onClick={finish}>
          Enter SideQuest
        </Button>
      </div>
    </ScreenShell>
  );
}

function RewardCard({ icon, label, value, wide }: { icon: React.ReactNode; label: string; value: string; wide?: boolean }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      className={`rounded-2xl border border-border bg-card/70 p-3.5 backdrop-blur ${wide ? "col-span-2" : ""}`}
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">{icon}</div>
      <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </motion.div>
  );
}