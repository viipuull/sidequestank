import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { enablePush, listenForeground, permissionState, pushReady, syncPushToken, PUSH_ASKED_KEY } from "@/lib/push/client";
import { onboarding } from "@/lib/hooks/useOnboarding";

/**
 * Shown only on Home, only for signed-in players who finished onboarding.
 * Never mounted on the landing/auth screens.
 */
export function PushPrompt({ userId }: { userId?: string }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  // Silent token refresh for players who already granted permission.
  useEffect(() => {
    if (!userId || !pushReady()) return;
    if (permissionState() !== "granted") return;
    void syncPushToken().catch(() => {});
    let off: (() => void) | undefined;
    void listenForeground((d) => {
      toast(d['title'] ?? "SideQuest", {
        description: d['body'] ?? "",
        action: d['deep_link']
          ? { label: "Open", onClick: () => navigate({ to: d['deep_link'] as string }) }
          : undefined,
      });
    }).then((unsub) => { off = unsub as () => void; });
    return () => off?.();
  }, [userId, navigate]);

  // Ask once, after onboarding, on Home.
  useEffect(() => {
    if (!userId || !pushReady()) return;
    if (!onboarding.isOnboarded()) return;
    if (permissionState() !== "default") return;
    if (localStorage.getItem(PUSH_ASKED_KEY) === "1") return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [userId]);

  const allow = async () => {
    setBusy(true);
    const result = await enablePush().catch(() => "denied" as const);
    setBusy(false);
    setVisible(false);
    if (result === "granted") toast.success("Notifications on — you'll hear about new quests first.");
    else toast("No problem — you can turn these on later in Settings.");
  };

  const dismiss = () => {
    localStorage.setItem(PUSH_ASKED_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 8, filter: "blur(6px)" }}
          className="relative mt-4 overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-4 backdrop-blur"
        >
          <button onClick={dismiss} aria-label="Dismiss" className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">Never miss a quest drop</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Get alerts for new quests near you, events and rewards.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={allow}
                  disabled={busy}
                  className="rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground active:scale-95 disabled:opacity-60"
                >
                  {busy ? "Enabling…" : "Turn on"}
                </button>
                <button onClick={dismiss} className="rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground active:scale-95">
                  Not now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}