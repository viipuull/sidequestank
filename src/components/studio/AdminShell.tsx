import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Search, Command as CmdIcon, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { StudioSidebar } from "@/components/studio/StudioSidebar";
import { StudioCommandPalette } from "@/components/studio/StudioCommandPalette";
import { Button } from "@/components/ui/button";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";

/**
 * The single administrative shell used by every founder / studio route.
 * Provides:
 *  - Founder gate (redirects non-founders home)
 *  - Sidebar + collapsible mini-rail
 *  - Sticky top bar with search palette and quick links
 *  - A single scroll container for the page body
 */
export function AdminShell({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL;
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isFounder) navigate({ to: "/home" });
  }, [loading, isFounder, navigate]);

  if (loading || !isFounder) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading Studio" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] flex w-full bg-background text-foreground">
        <StudioSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur">
            <SidebarTrigger aria-label="Toggle sidebar" />
            <button
              onClick={() => setCmdOpen(true)}
              aria-label="Open Studio search"
              className="ml-1 flex flex-1 max-w-md items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/60 transition min-h-11"
            >
              <Search className="h-4 w-4" aria-hidden />
              <span className="flex-1 text-left">Search Studio…</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-background/60 px-1.5 py-0.5 text-[10px] font-medium">
                <CmdIcon className="h-3 w-3" aria-hidden />K
              </kbd>
            </button>
            <div className="ml-auto flex items-center gap-1">
              <Button asChild variant="ghost" size="sm" aria-label="Notifications">
                <Link to="/notifications"><Bell className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link to="/home">
                  App <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
              {children ?? <Outlet />}
            </div>
          </main>
        </SidebarInset>
        <StudioCommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      </div>
    </SidebarProvider>
  );
}