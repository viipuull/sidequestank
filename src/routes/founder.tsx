import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/layout/AuthGate";
import { AdminShell } from "@/components/studio/AdminShell";

/**
 * Legacy /founder/* URLs now render inside the same AdminShell as /studio/*
 * so there is exactly one administrative experience. Individual child
 * routes still live at founder.<name>.tsx for backwards compatibility.
 */
export const Route = createFileRoute("/founder")({
  head: () => ({
    meta: [
      { title: "SideQuest Studio" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AuthGate>
      <AdminShell />
    </AuthGate>
  ),
});