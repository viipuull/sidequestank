import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Sparkles, Trophy } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SideQuest — Your City. Your Adventure." },
      {
        name: "description",
        content:
          "Explore Ankleshwar, complete real-world quests, earn XP and unlock badges with SideQuest.",
      },
      { property: "og:title", content: "SideQuest — Your City. Your Adventure." },
      {
        property: "og:description",
        content:
          "Explore Ankleshwar, complete real-world quests, earn XP and unlock badges with SideQuest.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 0%, oklch(0.35 0.15 295 / 0.6), transparent 70%), radial-gradient(50% 30% at 80% 90%, oklch(0.45 0.18 40 / 0.35), transparent 70%)",
        }}
      />
      <section className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-between px-6 py-10">
        <div className="flex w-full items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {BRAND.city}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Beta
          </span>
        </div>

        <div className="flex flex-col items-center text-center">
          <Logo size={220} priority className="drop-shadow-[0_10px_30px_rgba(124,58,237,0.35)]" />
          <h1 className="mt-4 text-3xl font-black tracking-tight">
            {BRAND.tagline}
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {BRAND.description}
          </p>
        </div>

        <div className="w-full space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-3 backdrop-blur">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Foundation ready</p>
              <p className="truncate text-xs text-muted-foreground">
                Design system, routing, backend & PWA wired up.
              </p>
            </div>
          </div>
          <p className="text-center text-[11px] uppercase tracking-widest text-muted-foreground">
            Quests launching soon
          </p>
        </div>
      </section>
    </main>
  );
}
