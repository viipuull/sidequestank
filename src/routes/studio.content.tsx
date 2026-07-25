import { createFileRoute } from "@tanstack/react-router";
import { StudioComingSoon } from "@/components/studio/StudioComingSoon";

export const Route = createFileRoute("/studio/content")({
  component: () => (
    <StudioComingSoon
      title="Content Manager"
      description="Unified interface for quests, collections, achievements, titles, events, challenges, announcements. Bulk operations, filters, saved views."
      phase="Phase 3"
    />
  ),
});