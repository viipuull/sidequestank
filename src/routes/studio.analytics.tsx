import { createFileRoute } from "@tanstack/react-router";
import { StudioComingSoon } from "@/components/studio/StudioComingSoon";

export const Route = createFileRoute("/studio/analytics")({
  component: () => (
    <StudioComingSoon
      title="Analytics"
      description="DAU / WAU / MAU, retention, quest funnels, XP flows, and event participation."
      phase="Phase 2"
    />
  ),
});