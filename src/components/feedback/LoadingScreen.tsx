import { Compass } from "lucide-react";

export function LoadingScreen({
  label = "Loading",
  fullscreen = true,
}: {
  label?: string;
  fullscreen?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={
        (fullscreen ? "grid min-h-[100dvh] " : "grid min-h-[40vh] ") +
        "place-items-center bg-background"
      }
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative grid h-14 w-14 place-items-center" aria-hidden="true">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary motion-reduce:animate-none" />
          <span className="glow-breathe absolute inset-2 rounded-full bg-primary/10" />
          <Compass className="relative h-6 w-6 text-primary" />
        </div>
        <span className="text-sm text-muted-foreground">{label}…</span>
      </div>
    </div>
  );
}