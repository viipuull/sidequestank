import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { ScreenShell } from "@/components/onboarding/ScreenShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Finishing sign in — SideQuest" },
      {
        name: "description",
        content: "Complete your SideQuest Google sign-in securely.",
      },
      { property: "og:title", content: "Finishing sign in — SideQuest" },
      {
        property: "og:description",
        content: "Complete your SideQuest Google sign-in securely.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallbackPage,
});

function readOAuthError() {
  if (typeof window === "undefined") return null;

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return (
    searchParams.get("error_description") ??
    hashParams.get("error_description") ??
    searchParams.get("error") ??
    hashParams.get("error")
  );
}

async function waitForOAuthSession() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabase.auth.getSession();
    if (data.session) return { sessionReady: true, error: null };
    if (error && attempt > 2) return { sessionReady: false, error };
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return { sessionReady: false, error: null };
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finishSignIn = async () => {
      const oauthError = readOAuthError();
      if (oauthError) {
        setError(oauthError);
        return;
      }

      const { sessionReady, error: sessionError } = await waitForOAuthSession();
      if (cancelled) return;

      if (!sessionReady) {
        setError(
          sessionError?.message ??
            "Google sign-in returned without a session. Check that this exact callback URL is allowed in your auth settings.",
        );
        return;
      }

      navigate({ to: "/auth", replace: true });
    };

    void finishSignIn();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <ScreenShell className="justify-center" glow>
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Logo size={112} priority />
        {error ? (
          <>
            <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">Sign-in needs attention</h1>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{error}</p>
            <Button className="mt-8 w-full" onClick={() => navigate({ to: "/auth", replace: true })}>
              Try again
            </Button>
          </>
        ) : (
          <>
            <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">Finishing sign in</h1>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Securing your SideQuest session and loading your player profile.
            </p>
          </>
        )}
      </motion.div>
    </ScreenShell>
  );
}