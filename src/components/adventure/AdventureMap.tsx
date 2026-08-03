import { Suspense, lazy, useEffect, useState } from "react";
import { Navigation } from "lucide-react";
import type { AdventureMapEngineProps } from "./AdventureMapEngine";

/** Leaflet touches `window` at import time, so the engine never enters SSR. */
const Engine = lazy(() => import("./AdventureMapEngine"));

export function AdventureMap(props: AdventureMapEngineProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <AdventureSkeleton className={props.className} />;
  return (
    <Suspense fallback={<AdventureSkeleton className={props.className} />}>
      <Engine {...props} />
    </Suspense>
  );
}

function AdventureSkeleton({ className }: { className?: string }) {
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-card/40 ${className ?? ""}`}>
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Navigation className="h-6 w-6 animate-pulse text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">Calibrating route</span>
      </div>
    </div>
  );
}