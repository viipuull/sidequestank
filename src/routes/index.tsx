import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { onboarding } from "@/lib/hooks/useOnboarding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SideQuest — Your City. Your Adventure." },
      { name: "description", content: "Explore Ankleshwar, complete real-world quests, earn XP and unlock badges with SideQuest." },
      { property: "og:title", content: "SideQuest — Your City. Your Adventure." },
      { property: "og:description", content: "Explore Ankleshwar, complete real-world quests, earn XP and unlock badges with SideQuest." },
    ],
  }),
  component: SplashRoute,
});

function SplashRoute() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const error = searchParams.get("error") ?? hashParams.get("error");
    const errorDescription =
      searchParams.get("error_description") ?? hashParams.get("error_description");

    if (error || errorDescription) {
      navigate({
        to: "/auth",
        search: { error: errorDescription ?? error ?? "Google sign-in failed" },
        replace: true,
      });
      return;
    }

    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    void supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .finally(() => navigate({ to: "/auth", replace: true }));
  }, [navigate]);

  useEffect(() => {
    const minDelay = new Promise((r) => setTimeout(r, 2000));
    (async () => {
      await minDelay;
      if (authLoading) return;
      if (!onboarding.isOnboarded()) {
        navigate({ to: "/welcome" });
        return;
      }
      if (!user) {
        navigate({ to: "/auth" });
        return;
      }
      if (profileLoading) return;
      if (!profile) {
        navigate({ to: "/profile-setup" });
        return;
      }
      if (!onboarding.isTutorialDone()) {
        navigate({ to: "/tutorial" });
        return;
      }
      navigate({ to: "/home" });
    })();
  }, [authLoading, profileLoading, user, profile, navigate]);

  return (
    <main
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background text-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        style={{
          background:
            "radial-gradient(50% 40% at 50% 50%, oklch(0.55 0.22 295 / 0.5), transparent 70%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.9, 1.1, 0.95], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <Logo size={200} priority className="drop-shadow-[0_10px_40px_rgba(124,58,237,0.5)]" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-4 text-[11px] uppercase tracking-[0.35em] text-muted-foreground whitespace-pre-wrap text-center max-w-[80vw]"
        >
          {"'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            https://cuddly-cosmos-creator.lovable.app can u copy this sites animation and ui to ours"}
        </motion.p>
        <motion.div
          className="absolute -bottom-24 left-1/2 h-1 w-24 -translate-x-1/2 overflow-hidden rounded-full bg-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--gradient-hero)" }}
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </main>
  );
}
