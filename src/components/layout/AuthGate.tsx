import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { onboarding } from "@/lib/hooks/useOnboarding";

export function AuthGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile(user?.id);

  useEffect(() => {
    if (loading) return;
    if (!onboarding.isOnboarded()) { navigate({ to: "/welcome" }); return; }
    if (!user) { navigate({ to: "/auth" }); return; }
    if (profileLoading) return;
    // Only route to profile-setup when we know for sure there's no profile row.
    // If the query errored, don't bounce — let the child render with fallbacks.
    if (!profile && !profileError) { navigate({ to: "/profile-setup" }); return; }
  }, [loading, profileLoading, user, profile, profileError, navigate]);

  if (loading || !user || (profileLoading && !profile)) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!profile) {
    // Profile query settled without data (error path); render children with defaults
    // rather than blocking the app forever.
  }
  return <>{children}</>;
}