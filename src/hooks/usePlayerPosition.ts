import { useCallback, useEffect, useRef, useState } from "react";

export type PlayerPosition = {
  lat: number;
  lng: number;
  accuracy: number;
  /** Degrees clockwise from north, when the device reports it. */
  heading: number | null;
};

type State = {
  position: PlayerPosition | null;
  status: "idle" | "locating" | "ready" | "denied" | "unavailable";
  error: string | null;
};

/**
 * Watches the player's location. Never throws, never blocks render: the world
 * stays fully usable when permission is denied.
 */
export function usePlayerPosition(enabled = true) {
  const [state, setState] = useState<State>({ position: null, status: "idle", error: null });
  const watchId = useRef<number | null>(null);
  const headingRef = useRef<number | null>(null);

  const apply = useCallback((pos: GeolocationPosition) => {
    setState({
      status: "ready",
      error: null,
      position: {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading:
          typeof pos.coords.heading === "number" && !Number.isNaN(pos.coords.heading)
            ? pos.coords.heading
            : headingRef.current,
      },
    });
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, status: "unavailable" }));
      return;
    }
    setState((s) => ({ ...s, status: s.position ? s.status : "locating" }));

    watchId.current = navigator.geolocation.watchPosition(
      apply,
      (err) =>
        setState((s) => ({
          ...s,
          status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
          error: err.message,
        })),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );

    const onOrient = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
      const h = e.webkitCompassHeading ?? (typeof e.alpha === "number" ? 360 - e.alpha : null);
      if (h == null || Number.isNaN(h)) return;
      headingRef.current = h;
      setState((s) => (s.position ? { ...s, position: { ...s.position, heading: h } } : s));
    };
    window.addEventListener("deviceorientation", onOrient as EventListener);

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      window.removeEventListener("deviceorientation", onOrient as EventListener);
    };
  }, [enabled, apply]);

  return state;
}
