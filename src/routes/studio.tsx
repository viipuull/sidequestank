import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/layout/AuthGate";
import { AdminShell } from "@/components/studio/AdminShell";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "SideQuest Studio Pro" },
      { name: "description", content: "Founder operations, analytics, moderation, and content management for SideQuest." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AuthGate>
      <AdminShell />
    </AuthGate>
  ),
});