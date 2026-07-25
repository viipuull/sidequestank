import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ScreenShell } from "@/components/onboarding/ScreenShell";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { onboarding } from "@/lib/hooks/useOnboarding";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/sidequest-logo.png.asset.json";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";
const FOUNDER_USERNAME = "sidequest";
const FOUNDER_DISPLAY_NAME = "SideQuest";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SideQuest" },
      { name: "description", content: "Sign in with Google to start your SideQuest adventure." },
      { property: "og:title", content: "Sign in — SideQuest" },
      { property: "og:description", content: "Sign in with Google to start your SideQuest adventure." },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.3-1.65 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.15.8 3.87 1.5l2.65-2.55C16.9 3.2 14.7 2.2 12 2.2 6.5 2.2 2 6.7 2 12.2s4.5 10 10 10c5.8 0 9.6-4.05 9.6-9.8 0-.66-.07-1.15-.15-1.65H12z"/>
      <path fill="#4285F4" d="M21.6 12.4c0-.66-.07-1.15-.15-1.65H12v3.9h5.5c-.11.6-.7 1.5-1.5 2.1l2.4 1.85c1.4-1.3 2.2-3.2 2.2-6.2z"/>
      <path fill="#FBBC05" d="M6 14.4l-.6.45L3.2 16.6C4.7 19.55 7.6 22 12 22c2.7 0 5-1 6.6-2.4l-2.4-1.85c-.7.5-1.7 1-4.2 1-3.2 0-5.9-2.15-6.9-5.15z"/>
      <path fill="#34A853" d="M12 22c2.7 0 5-1 6.6-2.4l-2.4-1.85c-.7.5-1.7 1-4.2 1-3.2 0-5.9-2.15-6.9-5.15L3.2 16.6C4.7 19.55 7.6 22 12 22z"/>
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || profileLoading) return;
    if (profile) {
      navigate({ to: onboarding.isTutorialDone() ? "/home" : "/tutorial" });
      return;
    }
    const email = (user.email ?? "").toLowerCase();
    if (email === FOUNDER_EMAIL) {
      // Auto-create founder profile; skip profile setup entirely.
      (async () => {
        const { error: insErr } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            username: FOUNDER_USERNAME,
            display_name: FOUNDER_DISPLAY_NAME,
            avatar_url: logoAsset.url,
          },
          { onConflict: "id" },
        );
        if (insErr) {
          console.error("[founder-auto-profile] failed:", insErr);
          navigate({ to: "/profile-setup" });
          return;
        }
        onboarding.markTutorialDone();
        await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
        navigate({ to: "/home" });
      })();
    } else {
      navigate({ to: "/profile-setup" });
    }
  }, [authLoading, profileLoading, user, profile, navigate, queryClient]);

  const signIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError(result.error.message || "Sign-in failed. Please try again.");
        setSigningIn(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setSigningIn(false);
    }
  };

  return (
    <ScreenShell className="justify-between">
      <div />
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Logo size={130} priority />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Sign in to play</h1>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">
          Save your progress, sync across devices and appear on your city's leaderboard.
        </p>
      </motion.div>

      <div className="space-y-3">
        <Button
          size="lg"
          variant="secondary"
          className="h-14 w-full gap-3 bg-white text-black hover:bg-white/90"
          onClick={signIn}
          disabled={signingIn}
        >
          {signingIn ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span className="font-semibold">
            {signingIn ? "Signing you in…" : "Continue with Google"}
          </span>
        </Button>
        {error && (
          <p className="text-center text-xs text-destructive">{error}</p>
        )}
        <p className="text-center text-[11px] text-muted-foreground">
          By continuing you agree to the community rules.
        </p>
      </div>
    </ScreenShell>
  );
}