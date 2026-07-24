import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { ComingSoonScreen } from "@/components/layout/ComingSoonScreen";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — SideQuest" },
      { name: "description", content: "City-wide explorer rankings coming soon." },
      { property: "og:title", content: "Leaderboard — SideQuest" },
      { property: "og:description", content: "City-wide explorer rankings coming soon." },
    ],
  }),
  component: () => (
    <ComingSoonScreen
      icon={<Trophy className="h-11 w-11 text-accent" />}
      title="Leaderboard"
      desc="Compete with fellow explorers and climb your city's weekly ranks."
    />
  ),
});