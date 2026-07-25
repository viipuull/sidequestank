import { Link } from "@tanstack/react-router";
import { Award, Compass, Sparkles, Trophy, Layers } from "lucide-react";
import { PlayerAvatar } from "./PlayerAvatar";
import type { FeedItem } from "@/lib/activity.functions";

const ICON: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  quest_completed: { icon: Compass, color: "text-primary" },
  level_up: { icon: Sparkles, color: "text-amber-300" },
  title_unlocked: { icon: Trophy, color: "text-emerald-300" },
  achievement_unlocked: { icon: Award, color: "text-fuchsia-300" },
  collection_completed: { icon: Layers, color: "text-cyan-300" },
};

function describe(item: FeedItem) {
  const p = (item.payload ?? {}) as Record<string, string | number>;
  switch (item.kind) {
    case "quest_completed": return `completed "${p.quest_title ?? "a quest"}"`;
    case "level_up": return `reached Level ${p.level ?? "?"}`;
    case "title_unlocked": return `unlocked title "${p.title_name ?? "?"}"`;
    case "achievement_unlocked": return `earned "${p.name ?? "an achievement"}"`;
    case "collection_completed": return `completed "${p.name ?? "a collection"}"`;
    default: return "did something";
  }
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

export function ActivityItem({ item }: { item: FeedItem }) {
  const meta = ICON[item.kind] ?? ICON.quest_completed;
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-3">
      {item.profile ? (
        <Link to="/players/$username" params={{ username: item.profile.username }}>
          <PlayerAvatar url={item.profile.avatar_url} name={item.profile.display_name} size={40} />
        </Link>
      ) : (
        <PlayerAvatar url={null} name="?" size={40} />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          {item.profile ? (
            <Link to="/players/$username" params={{ username: item.profile.username }} className="font-semibold hover:underline">
              {item.profile.display_name}
            </Link>
          ) : (
            <span className="font-semibold">Someone</span>
          )}{" "}
          <span className="text-muted-foreground">{describe(item)}</span>
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(item.created_at)} ago</p>
      </div>
      <Icon className={`h-4 w-4 ${meta.color}`} />
    </div>
  );
}
