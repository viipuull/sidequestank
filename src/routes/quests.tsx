import { createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { ComingSoonScreen } from "@/components/layout/ComingSoonScreen";

export const Route = createFileRoute("/quests")({
  head: () => ({
    meta: [
      { title: "Quests — SideQuest" },
      { name: "description", content: "Real-world quests across Ankleshwar arrive soon." },
      { property: "og:title", content: "Quests — SideQuest" },
      { property: "og:description", content: "Real-world quests across Ankleshwar arrive soon." },
    ],
  }),
  component: () => (
    <ComingSoonScreen
      icon={<Compass className="h-11 w-11 text-primary" />}
      title="Quests"
      desc="Discover puzzles, photo hunts, and QR check-ins around your city. Launching in the next update."
    />
  ),
});