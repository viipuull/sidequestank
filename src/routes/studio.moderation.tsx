import { createFileRoute } from "@tanstack/react-router";
import { StudioComingSoon } from "@/components/studio/StudioComingSoon";

export const Route = createFileRoute("/studio/moderation")({
  component: () => (
    <StudioComingSoon
      title="Moderation"
      description="Suspend, hide, restore, grant XP/titles/badges, reset progress — all audit-logged."
      phase="Phase 2"
    />
  ),
});