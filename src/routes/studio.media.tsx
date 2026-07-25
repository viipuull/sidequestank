import { createFileRoute } from "@tanstack/react-router";
import { StudioComingSoon } from "@/components/studio/StudioComingSoon";

export const Route = createFileRoute("/studio/media")({
  component: () => (
    <StudioComingSoon
      title="Media Library"
      description="Search, tag, replace, and reuse imagery across quests, collections, events and badges."
      phase="Phase 3"
    />
  ),
});