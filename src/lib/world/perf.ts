/** Device capability tiers. Heavy ambience only runs on "high". */
export type PerfTier = "low" | "medium" | "high";

export function detectTier(): PerfTier {
  if (typeof window === "undefined") return "low";
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return "low";
  const mem = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const small = window.matchMedia("(max-width: 380px)").matches;
  if (mem <= 2 || cores <= 2) return "low";
  if (mem <= 4 || cores <= 4 || small) return "medium";
  return "high";
}

export const TIER_BUDGET: Record<PerfTier, { particles: number; birds: boolean; rays: boolean; fog: boolean }> = {
  low: { particles: 0, birds: false, rays: false, fog: false },
  medium: { particles: 10, birds: false, rays: true, fog: true },
  high: { particles: 22, birds: true, rays: true, fog: true },
};
