import { Loader2 } from "lucide-react";

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
        <Loader2 className="h-7 w-7 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">{label}…</span>
      </div>
    </div>
  );
}