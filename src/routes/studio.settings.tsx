import { createFileRoute } from "@tanstack/react-router";
import { StudioComingSoon } from "@/components/studio/StudioComingSoon";

export const Route = createFileRoute("/studio/settings")({
  component: () => (
    <StudioComingSoon
      title="System Settings"
      description="Branding, default rewards, XP/level formula, notifications, maintenance mode, roles and permissions."
      phase="Phase 4"
    />
  ),
});