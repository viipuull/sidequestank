import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, BellOff, ChevronLeft, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { Button } from "@/components/ui/button";
import { enablePush, permissionState, pushReady, syncPushToken } from "@/lib/push/client";
import { myPushDevices, removeMyPushTokens } from "@/lib/push.functions";

export const Route = createFileRoute("/settings/notifications")({
  head: () => ({
    meta: [
      { title: "Notification settings — SideQuest" },
      { name: "description", content: "Turn push alerts on or off for quests, events and rewards." },
      { property: "og:title", content: "Notification settings — SideQuest" },
      { property: "og:description", content: "Turn push alerts on or off for quests, events and rewards." },
    ],
  }),
  component: () => (<AuthGate><NotificationSettings /></AuthGate>),
});

function NotificationSettings() {
  const [state, setState] = useState<string>("default");
  const [busy, setBusy] = useState(false);
  const devicesFn = useServerFn(myPushDevices);
  const removeFn = useServerFn(removeMyPushTokens);
  const { data: devices, refetch } = useQuery({ queryKey: ["push-devices"], queryFn: () => devicesFn() });

  useEffect(() => { setState(permissionState()); }, []);

  const turnOn = async () => {
    setBusy(true);
    const result = await enablePush().catch(() => "denied" as const);
    setBusy(false);
    setState(result);
    if (result === "granted") { toast.success("Push notifications enabled."); void refetch(); }
    else if (result === "denied") toast.error("Your browser is blocking notifications. Allow them in site settings, then retry.");
    else toast("Push isn't available in this browser.");
  };

  const turnOff = async () => {
    setBusy(true);
    await removeFn().catch(() => {});
    setBusy(false);
    toast("This device will no longer receive push alerts.");
    void refetch();
  };

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <button onClick={() => history.back()} aria-label="Go back" className="grid h-11 w-11 place-items-center rounded-full border border-border">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            {state === "granted" ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Push alerts</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {!pushReady()
                ? "Push isn't set up on this browser yet."
                : state === "granted"
                  ? "On — you'll get new quests, event reminders and rewards."
                  : state === "denied"
                    ? "Blocked by your browser. Allow notifications for this site, then retry."
                    : "Off — turn on to hear about new quests first."}
            </p>
            <div className="mt-3 flex gap-2">
              {state === "granted" ? (
                <>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => { void syncPushToken().then(() => { toast.success("Device refreshed."); void refetch(); }); }}>
                    Refresh device
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={turnOff}>Turn off</Button>
                </>
              ) : (
                <Button size="sm" disabled={busy || !pushReady()} onClick={turnOn}>
                  {busy ? "Enabling…" : "Enable notifications"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Registered devices</p>
        {(devices ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No devices registered yet.</p>
        )}
        {(devices ?? []).map((d) => (
          <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-3">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{shortUa(d.user_agent)}</p>
              <p className="text-[10px] text-muted-foreground">Last seen {new Date(d.last_seen_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </section>
    </AppShell>
  );
}

function shortUa(ua: string | null) {
  if (!ua) return "Unknown device";
  if (/Android/i.test(ua)) return "Android · Chrome";
  if (/iPhone|iPad/i.test(ua)) return "iOS · Safari";
  if (/Edg\//i.test(ua)) return "Desktop · Edge";
  if (/Chrome\//i.test(ua)) return "Desktop · Chrome";
  if (/Firefox\//i.test(ua)) return "Desktop · Firefox";
  return "Browser";
}