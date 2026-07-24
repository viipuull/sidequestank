import { createFileRoute } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { ComingSoonScreen } from "@/components/layout/ComingSoonScreen";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "Collection — SideQuest" },
      { name: "description", content: "Your badge collection lives here." },
      { property: "og:title", content: "Collection — SideQuest" },
      { property: "og:description", content: "Your badge collection lives here." },
    ],
  }),
  component: () => (
    <ComingSoonScreen
      icon={<Award className="h-11 w-11 text-accent" />}
      title="Collection"
      desc="Every badge, memento and rare unlock will surface here as you play."
    />
  ),
});