import { createFileRoute, Navigate } from "@tanstack/react-router";

/**
 * Legacy mobile /founder dashboard is retired.
 * The single admin experience is /studio.
 */
export const Route = createFileRoute("/founder/")({
  head: () => ({
    meta: [
      { title: "SideQuest Studio" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <Navigate to="/studio" replace />,
});
