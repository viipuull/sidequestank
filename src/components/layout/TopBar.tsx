import { Link } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Sticky glass top bar. Slim brand strip on mobile, full utility bar on
 * desktop where the sidebar carries navigation.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 -mx-5 mb-4 border-b border-border/50 bg-background/60 px-5 backdrop-blur-2xl backdrop-saturate-150 lg:-mx-8 lg:px-8">
      <div className="flex h-14 items-center gap-3">
        <Link to="/home" className="flex items-center gap-2 lg:hidden">
          <Logo size={26} className="rounded-lg" priority />
          <span className="text-sm font-bold tracking-tight">SideQuest</span>
        </Link>

        <Link
          to="/quests"
          className="ml-auto hidden h-9 flex-1 items-center gap-2 rounded-xl border border-border/70 bg-card/50 px-3 text-xs text-muted-foreground backdrop-blur-xl transition-colors hover:border-primary/40 hover:text-foreground lg:flex lg:max-w-sm"
        >
          <Search className="h-3.5 w-3.5" />
          Search quests, players, collections…
        </Link>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-card/60 text-muted-foreground backdrop-blur-xl transition-colors hover:border-primary/40 hover:text-foreground active:scale-95"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}