import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Settings } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — SideQuest" },
      { name: "description", content: "Your SideQuest explorer profile." },
      { property: "og:title", content: "Your profile — SideQuest" },
      { property: "og:description", content: "Your SideQuest explorer profile." },
    ],
  }),
  component: () => (<AuthGate><ProfileInner /></AuthGate>),
});

function ProfileInner() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const p = profile!;
  const initials = p.display_name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Profile</h1>
        <Link to="/settings" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/60 text-muted-foreground">
          <Settings className="h-4 w-4" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-3xl border border-border bg-card/70 p-6 text-center backdrop-blur"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <Avatar className="mx-auto h-24 w-24 border-2 border-primary/40">
          {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.display_name} />}
          <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">{initials}</AvatarFallback>
        </Avatar>
        <h2 className="mt-3 text-xl font-bold">{p.display_name}</h2>
        <p className="text-sm text-muted-foreground">@{p.username}</p>
        {p.is_pioneer && (
          <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            🏅 Pioneer
          </span>
        )}
        <div className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 text-primary" /> {p.city}
        </div>
      </motion.div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Stat label="Level" value={String(p.level)} />
        <Stat label="XP" value={String(p.xp)} />
        <Stat label="Badges" value="1" />
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}