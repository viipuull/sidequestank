import { Suspense, lazy, useEffect, useState } from "react";
import { Compass } from "lucide-react";
import type { WorldMapEngineProps } from "./WorldMapEngine";

/**
 * Client-only boundary for the world map. Leaflet touches `window` at import
 * time, so the engine is never part of the SSR module graph.
 */
const Engine = lazy(() => import("./WorldMapEngine"));

export function WorldMap(props: WorldMapEngineProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <WorldSkeleton className={props.className} />;
  return (
    <Suspense fallback={<WorldSkeleton className={props.className} />}>
      <Engine {...props} />
    </Suspense>
  );
}

function WorldSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-3xl border border-border/60 bg-card/40 ${className ?? ""}`}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Compass className="h-6 w-6 animate-spin text-primary" style={{ animationDuration: "2.4s" }} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">Mapping Ankleshwar</span>
      </div>
    </div>
  );
}
