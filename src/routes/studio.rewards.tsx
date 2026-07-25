import { createFileRoute } from "@tanstack/react-router";
import { StudioComingSoon } from "@/components/studio/StudioComingSoon";

export const Route = createFileRoute("/studio/rewards")({
  component: () => (
    <StudioComingSoon
      title="Reward Manager"
      description="Manage XP, titles, achievements, collections and event rewards with bulk updates."
      phase="Phase 3"
    />
  ),
});