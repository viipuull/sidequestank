import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Radio } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { ActivityItem } from "@/components/social/ActivityItem";
import { getGlobalActivity } from "@/lib/activity.functions";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [
    { title: "Community Activity — SideQuest" },
    { name: "description", content: "See what SideQuest explorers around you are unlocking right now." },
    { property: "og:title", content: "Community Activity — SideQuest" },
    { property: "og:description", content: "Live activity from the SideQuest community." },
  ]}),
  component: () => (<AuthGate><ActivityPage /></AuthGate>),
});

function ActivityPage() {
  const fetch = useServerFn(getGlobalActivity);
  const q = useQuery({ queryKey: ["global-activity"], queryFn: () => fetch({ data: { limit: 40, offset: 0 } }), staleTime: 30_000 });
  return (
    <AppShell>
      <header className="flex items-center gap-2">
        <Radio className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Community Feed</h1>
      </header>
      <p className="mt-1 text-xs text-muted-foreground">Live activity from explorers around the world.</p>
      <div className="mt-4 space-y-2">
        {q.isLoading && <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        {q.data?.length === 0 && !q.isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">No activity yet — go start a quest!</p>
        )}
        {(q.data ?? []).map((it) => (<ActivityItem key={it.id} item={it} />))}
      </div>
    </AppShell>
  );
}
