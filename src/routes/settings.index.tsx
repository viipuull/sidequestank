import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, FileText, LogOut, Moon, Shield } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { onboarding } from "@/lib/hooks/useOnboarding";

const APP_VERSION = "0.2.0";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings — SideQuest" },
      { name: "description", content: "Manage your SideQuest preferences and account." },
      { property: "og:title", content: "Settings — SideQuest" },
      { property: "og:description", content: "Manage your SideQuest preferences and account." },
    ],
  }),
  component: () => (<AuthGate><SettingsInner /></AuthGate>),
});

function SettingsInner() {
  const navigate = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    onboarding.reset();
    navigate({ to: "/" });
  };
  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <button onClick={() => history.back()} className="grid h-9 w-9 place-items-center rounded-full border border-border">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
      </div>

      <section className="mt-6 space-y-2">
        <Row icon={<Moon className="h-4 w-4" />} title="Theme" value="Dark (default)" />
        <Row icon={<Shield className="h-4 w-4" />} title="Privacy" value="Coming soon" />
        <Row icon={<FileText className="h-4 w-4" />} title="Terms of use" value="Coming soon" />
        <Row icon={<FileText className="h-4 w-4" />} title="App version" value={APP_VERSION} />
      </section>

      <Button variant="secondary" className="mt-6 w-full gap-2" onClick={logout}>
        <LogOut className="h-4 w-4" /> Log out
      </Button>
    </AppShell>
  );
}

function Row({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}