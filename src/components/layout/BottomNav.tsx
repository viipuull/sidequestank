import { Link } from "@tanstack/react-router";
import { Home, Compass, Trophy, Award, User } from "lucide-react";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/quests", label: "Quests", icon: Compass },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/collection", label: "Collect", icon: Award },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                className="group flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground transition-all duration-200 active:scale-95"
                activeProps={{ className: "text-primary" }}
              >
                <Icon className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}