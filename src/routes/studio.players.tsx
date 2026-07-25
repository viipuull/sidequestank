import { createFileRoute } from "@tanstack/react-router";
import { StudioComingSoon } from "@/components/studio/StudioComingSoon";

export const Route = createFileRoute("/studio/players")({
  component: () => (
    <StudioComingSoon
      title="Players"
      description="Search players, inspect progress, XP, titles, collections, achievements and activity."
      phase="Phase 2"
    />
  ),
});