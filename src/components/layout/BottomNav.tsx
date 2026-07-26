import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, Trophy, Award, User } from "lucide-react";
import { motion } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";
import { springs } from "@/lib/motion";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/quests", label: "Quests", icon: Compass },
  { to: "/leaderboard", label: "Leaders", icon: Trophy },
  { to: "/collections", label: "Sets", icon: Award },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const haptic = useHaptic();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive =
            pathname === t.to || pathname.startsWith(t.to + "/");
          return (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                onClick={() => haptic.tick()}
                className="group relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors duration-200"
                activeProps={{ className: "text-primary" }}
              >
                {isActive && (
                  <motion.span
                    layoutId="bottomnav-pill"
                    className="absolute inset-x-3 top-1 h-8 rounded-2xl bg-primary/15"
                    transition={springs.snappy}
                  />
                )}
                <motion.span
                  animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                  whileTap={{ scale: 0.88 }}
                  transition={springs.bouncy}
                  className="relative z-10"
                >
                  <Icon className="h-5 w-5" />
                </motion.span>
                <span className="relative z-10">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}