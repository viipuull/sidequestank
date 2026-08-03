import { distanceM } from "./geo";

/** A single navigable checkpoint derived from a quest objective. */
export type Waypoint = {
  id: string;
  index: number;
  title: string;
  description?: string | null;
  objectiveType: string;
  lat: number;
  lng: number;
  radiusM: number;
  /** Whether the objective carries real coordinates (vs. quest fallback). */
  precise: boolean;
  state: "done" | "current" | "upcoming" | "pending";
};

export type ObjectiveLike = {
  id: string;
  title: string;
  description?: string | null;
  objective_type: string;
  config?: unknown;
};

export type LatLng = { lat: number; lng: number };

function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

/**
 * Map objectives to navigable waypoints. Objectives without their own
 * coordinates inherit the quest anchor so the route never breaks.
 */
export function buildWaypoints(
  objectives: ObjectiveLike[],
  statusOf: (id: string) => string | undefined,
  questAnchor: LatLng | null,
): Waypoint[] {
  const out: Waypoint[] = [];
  let currentAssigned = false;

  objectives.forEach((o, i) => {
    const cfg = (o.config ?? {}) as Record<string, unknown>;
    const lat = num(cfg.latitude) ?? num(cfg.lat) ?? questAnchor?.lat ?? null;
    const lng = num(cfg.longitude) ?? num(cfg.lng) ?? questAnchor?.lng ?? null;
    if (lat == null || lng == null) return;

    const precise = num(cfg.latitude) != null || num(cfg.lat) != null;
    const status = statusOf(o.id);
    let state: Waypoint["state"];
    if (status === "completed") state = "done";
    else if (status === "pending_review") state = "pending";
    else if (!currentAssigned) {
      state = "current";
      currentAssigned = true;
    } else state = "upcoming";

    out.push({
      id: o.id,
      index: i,
      title: o.title,
      description: o.description ?? null,
      objectiveType: o.objective_type,
      lat,
      lng,
      radiusM: num(cfg.radius_m) ?? 60,
      precise,
      state,
    });
  });

  // Nudge duplicate coordinates apart so overlapping pins stay tappable.
  const seen = new Map<string, number>();
  return out.map((w) => {
    const key = `${w.lat.toFixed(5)}|${w.lng.toFixed(5)}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    if (n === 0) return w;
    const angle = (n * 137.5 * Math.PI) / 180;
    const r = 0.00022 * (1 + Math.floor(n / 6));
    return { ...w, lat: w.lat + Math.sin(angle) * r, lng: w.lng + Math.cos(angle) * r };
  });
}

/** The waypoint the player is currently being guided toward. */
export function currentWaypoint(ws: Waypoint[]): Waypoint | null {
  return ws.find((w) => w.state === "current") ?? ws.find((w) => w.state === "pending") ?? null;
}

/** Distance from the player to a waypoint, or null when either is unknown. */
export function distanceTo(player: LatLng | null, w: Waypoint | null): number | null {
  if (!player || !w) return null;
  return distanceM(player, w);
}

/**
 * Reveal rule for the discovery effect: far-away future checkpoints stay
 * "unknown signals" until the player closes in.
 */
export const REVEAL_RADIUS_M = 400;

export function isRevealed(w: Waypoint, player: LatLng | null): boolean {
  if (w.state === "done" || w.state === "current" || w.state === "pending") return true;
  if (!w.precise) return true;
  const d = distanceTo(player, w);
  return d != null && d <= REVEAL_RADIUS_M;
}

/** Linear interpolation between two coordinates, used for smooth marker glide. */
export function lerpLatLng(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}