import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Eye, HandHeart, Shield, ShieldAlert, Sparkles } from "lucide-react";
import { ScreenShell } from "@/components/onboarding/ScreenShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { onboarding } from "@/lib/hooks/useOnboarding";

const RULES = [
  { icon: Shield, text: "Respect public places." },
  { icon: Eye, text: "Stay safe and aware while exploring." },
  { icon: ShieldAlert, text: "Do not trespass private property." },
  { icon: Sparkles, text: "Be honest when completing quests." },
  { icon: HandHeart, text: "Help keep the community positive." },
];

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Community Rules — SideQuest" },
      { name: "description", content: "The five rules every SideQuest explorer follows." },
      { property: "og:title", content: "Community Rules — SideQuest" },
      { property: "og:description", content: "The five rules every SideQuest explorer follows." },
    ],
  }),
  component: Rules,
});

function Rules() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const onContinue = () => {
    onboarding.setOnboarded();
    navigate({ to: "/auth" });
  };

  return (
    <ScreenShell className="justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">The Explorer's Code</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Community Rules</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Adventures are more fun when everyone plays fair. A few things to keep in mind:
        </p>
      </div>

      <ul className="my-6 space-y-2.5">
        {RULES.map((r, idx) => {
          const Icon = r.icon;
          return (
            <motion.li
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx, duration: 0.25 }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-3.5 backdrop-blur"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{r.text}</span>
            </motion.li>
          );
        })}
      </ul>

      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card/60 p-4">
          <Checkbox
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
            aria-label="I have read and agree to the community rules"
          />
          <span className="text-sm font-medium">I have read and agree.</span>
        </label>
        <Button
          size="lg"
          className="h-14 w-full text-base font-semibold"
          disabled={!agreed}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </ScreenShell>
  );
}