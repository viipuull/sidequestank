import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { ScreenShell } from "@/components/onboarding/ScreenShell";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to SideQuest" },
      { name: "description", content: "Start your real-world adventure in Ankleshwar." },
      { property: "og:title", content: "Welcome to SideQuest" },
      { property: "og:description", content: "Start your real-world adventure in Ankleshwar." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  return (
    <ScreenShell className="justify-between">
      <div />
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Logo size={180} priority className="drop-shadow-[0_10px_40px_rgba(124,58,237,0.4)]" />
        <h1 className="mt-6 text-4xl font-black tracking-tight leading-[1.05]">
          Your City.
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-hero)" }}
          >
            Your Adventure.
          </span>
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {BRAND.description}
        </p>
      </motion.div>
      <motion.div
        className="w-full space-y-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Button
          size="lg"
          className="h-14 w-full text-base font-semibold shadow-[0_10px_30px_-10px_oklch(0.62_0.22_295/0.7)]"
          onClick={() => navigate({ to: "/onboarding" })}
        >
          Start Your Adventure
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => navigate({ to: "/onboarding" })}
        >
          Learn More
        </Button>
      </motion.div>
    </ScreenShell>
  );
}