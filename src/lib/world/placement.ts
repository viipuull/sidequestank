import type { WorldConfig } from "./config";
import type { WorldQuest } from "./types";

/** Stable 32-bit hash so a quest always lands in the same spot. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Resolves a quest to world coordinates. Real lat/lng always wins; quests
 * without coordinates are anchored deterministically near a weighted landmark
 * so the world never looks empty and a quest never jumps between sessions.
 */
export function placeQuest(
  quest: WorldQuest,
  world: WorldConfig,
): { lat: number; lng: number; approximate: boolean } {
  if (typeof quest.latitude === "number" && typeof quest.longitude === "number") {
    return { lat: quest.latitude, lng: quest.longitude, approximate: false };
  }
  const pool = world.landmarks.flatMap((l) => Array.from({ length: l.weight ?? 1 }, () => l));
  const h = hash(quest.id || quest.slug);
  const anchor = pool[h % pool.length];
  const angle = ((h >>> 8) % 360) * (Math.PI / 180);
  const radius = 0.004 + (((h >>> 16) % 100) / 100) * 0.010; // ~450m–1.5km
  return {
    lat: anchor.lat + Math.sin(angle) * radius,
    lng: anchor.lng + Math.cos(angle) * radius * 1.05,
    approximate: true,
  };
}
