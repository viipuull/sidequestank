import { Suspense, lazy, useEffect, useState } from "react";
import type { ObjectiveMapEditorProps } from "./ObjectiveMapEditorEngine";

const Engine = lazy(() => import("./ObjectiveMapEditorEngine"));

/** Lazy, client-only wrapper so Leaflet never enters the SSR module graph. */
export function ObjectiveMapEditor(props: ObjectiveMapEditorProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const fallback = (
    <div className={`grid place-items-center rounded-2xl bg-muted/40 text-[11px] text-muted-foreground ${props.className ?? ""}`}>
      Loading map…
    </div>
  );
  if (!mounted) return fallback;
  return (
    <Suspense fallback={fallback}>
      <Engine {...props} />
    </Suspense>
  );
}