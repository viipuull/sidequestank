import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { useDeleteNotif, useMarkAllNotifRead, useMarkNotifRead, useMyNotifications } from "@/lib/hooks/useLiveOps";
import { EmptyState, LoadingScreen } from "@/components/feedback";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — SideQuest" },
      { name: "description", content: "Your SideQuest notifications." },
      { property: "og:title", content: "Notifications — SideQuest" },
      { property: "og:description", content: "Level ups, event drops and rewards, all in one place." },
    ],
  }),
  component: () => (<AuthGate><NotificationsPage /></AuthGate>),
});

function NotificationsPage() {
  const { data, isLoading } = useMyNotifications();
  const markAll = useMarkAllNotifRead();
  const markOne = useMarkNotifRead();
  const del = useDeleteNotif();
  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <AppShell>
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Inbox</p>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAll.mutate()} className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </header>

      {isLoading && <LoadingScreen label="Loading notifications" fullscreen={false} />}

      {!isLoading && items.length === 0 && (
        <div className="mt-10">
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description="Level ups, event drops and rewards will appear here as soon as they arrive."
          />
        </div>
      )}

      <div className="mt-4 space-y-2">
        {items.map((n) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 rounded-2xl border p-3.5 backdrop-blur ${n.read_at ? "border-border bg-card/50" : "border-primary/30 bg-primary/5"}`}>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-lg">{n.icon ?? "🔔"}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">{n.title}</p>
                {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
              <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{new Date(n.created_at).toLocaleString()}</span>
                <span className="uppercase tracking-wider">{n.kind.replace(/_/g, " ")}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {!n.read_at && (
                <button onClick={() => markOne.mutate(n.id)} className="rounded-full p-1.5 text-muted-foreground hover:text-primary" aria-label="Mark read">
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => del.mutate(n.id)} className="rounded-full p-1.5 text-muted-foreground hover:text-destructive" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </AppShell>
  );
}