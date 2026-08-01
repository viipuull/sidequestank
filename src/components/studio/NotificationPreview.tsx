import { useState } from "react";
import { PRIORITY_META, type PushPriority } from "@/lib/push/templates";

type Props = {
  title: string;
  body: string;
  image?: string;
  actionLabel?: string;
  priority: PushPriority;
  icon?: string;
};

const DEVICES = ["Android", "Chrome desktop", "Edge desktop"] as const;

/** Renders the notification the way each platform will actually draw it. */
export function NotificationPreview({ title, body, image, actionLabel, priority, icon }: Props) {
  const [device, setDevice] = useState<(typeof DEVICES)[number]>("Android");
  const meta = PRIORITY_META[priority];

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>
        <div className="flex gap-1">
          {DEVICES.map((d) => (
            <button key={d} onClick={() => setDevice(d)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition active:scale-95 ${
                device === d ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
              }`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl border ${meta.ring} bg-background/80 p-3 shadow-lg`}>
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-base">
            {icon || "🔔"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              <p className="truncate text-[11px] text-muted-foreground">
                SideQuest · {device === "Android" ? "now" : "sidequestank.fun"}
              </p>
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm font-bold">{title || "Notification title"}</p>
            <p className={`mt-0.5 text-xs text-muted-foreground ${device === "Android" ? "line-clamp-3" : "line-clamp-2"}`}>
              {body || "Your message will appear here."}
            </p>
            {image && (
              <img src={image} alt="" className="mt-2 h-28 w-full rounded-lg object-cover" />
            )}
            {actionLabel && (
              <div className="mt-2 flex gap-2">
                <span className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold">{actionLabel}</span>
                <span className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground">Dismiss</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {meta.label} · variables are replaced per player before delivery.
      </p>
    </div>
  );
}