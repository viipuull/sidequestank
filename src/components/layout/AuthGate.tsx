import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { onboarding } from "@/lib/hooks/useOnboarding";

export function AuthGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);

  useEffect(() => {
    if (loading) return;
    if (!onboarding.isOnboarded()) { navigate({ to: "/welcome" }); return; }
    if (!user) { navigate({ to: "/auth" }); return; }
    if (profileLoading) return;
    if (!profile) { navigate({ to: "/profile-setup" }); return; }
  }, [loading, profileLoading, user, profile, navigate]);

  if (loading || !user || profileLoading || !profile) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}