import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  Award,
  BadgeCheck,
  Bell,
  Calendar,
  Compass,
  Home,
  Settings,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { springs } from "@/lib/motion";

const GROUPS = [
  {
    label: "Explore",
    items: [
      { to: "/home", label: "Home", icon: Home },
      { to: "/quests", label: "Quests", icon: Compass },
      { to: "/events", label: "Events", icon: Calendar },
      { to: "/activity", label: "Activity", icon: Activity },
    ],
  },
  {
    label: "Progress",
    items: [
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { to: "/collections", label: "Collections", icon: Award },
      { to: "/achievements", label: "Achievements", icon: BadgeCheck },
      { to: "/titles", label: "Titles", icon: Users },
    ],
  },
  {
    label: "You",
    items: [
      { to: "/profile", label: "Profile", icon: User },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

/** Desktop-only glass sidebar. Mobile keeps the existing bottom nav. */
export function SideNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      aria-label="Sidebar"
      className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/60 bg-sidebar/70 backdrop-blur-2xl lg:flex"
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Logo size={34} className="rounded-xl" priority />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold tracking-tight">SideQuest</div>
          <div className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Ankleshwar
          </div>
        </div>
      </div>

      <nav className="sq-scroll flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidenav-active"
                          transition={springs.snappy}
                          className="absolute inset-0 rounded-xl border border-primary/25 bg-primary/12"
                        />
                      )}
                      <Icon className="relative z-10 h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span className="relative z-10 truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/60 px-5 py-4 text-[10px] text-muted-foreground">
        Beta · Your city. Your adventure.
      </div>
    </aside>
  );
}