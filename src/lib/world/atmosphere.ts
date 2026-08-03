/**
 * Time-of-day atmosphere. Drives tile grading and ambient colour so the world
 * reads warm at dawn, clear at noon, orange at dusk and deep blue at night.
 */
export type Phase = "dawn" | "morning" | "afternoon" | "evening" | "night";

export type Atmosphere = {
  phase: Phase;
  label: string;
  /** CSS filter applied to the tile pane. */
  tileFilter: string;
  /** Colour wash over the tiles. */
  wash: string;
  /** Glow colour for quest markers and ambient light. */
  glow: string;
  /** Show stars + moon. */
  stars: boolean;
};

export const ATMOSPHERES: Record<Phase, Atmosphere> = {
  dawn: {
    phase: "dawn",
    label: "Dawn",
    tileFilter: "brightness(0.95) saturate(1.05) hue-rotate(-8deg)",
    wash: "radial-gradient(120% 90% at 50% 100%, oklch(0.62 0.14 60 / 0.20), transparent 70%)",
    glow: "oklch(0.78 0.15 70)",
    stars: false,
  },
  morning: {
    phase: "morning",
    label: "Morning",
    tileFilter: "brightness(1.06) saturate(1.05) hue-rotate(-4deg)",
    wash: "radial-gradient(120% 90% at 50% 0%, oklch(0.75 0.11 80 / 0.16), transparent 65%)",
    glow: "oklch(0.80 0.13 85)",
    stars: false,
  },
  afternoon: {
    phase: "afternoon",
    label: "Afternoon",
    tileFilter: "brightness(1.12) saturate(1.0) contrast(1.02)",
    wash: "radial-gradient(120% 90% at 50% 0%, oklch(0.80 0.06 240 / 0.12), transparent 65%)",
    glow: "oklch(0.82 0.12 250)",
    stars: false,
  },
  evening: {
    phase: "evening",
    label: "Evening",
    tileFilter: "brightness(0.94) saturate(1.12) hue-rotate(-14deg)",
    wash: "radial-gradient(120% 90% at 50% 100%, oklch(0.60 0.17 45 / 0.26), transparent 72%)",
    glow: "oklch(0.74 0.17 45)",
    stars: false,
  },
  night: {
    phase: "night",
    label: "Night",
    tileFilter: "brightness(0.72) saturate(0.9) hue-rotate(10deg) contrast(1.06)",
    wash: "radial-gradient(120% 95% at 50% 0%, oklch(0.38 0.13 265 / 0.34), transparent 74%)",
    glow: "oklch(0.68 0.19 285)",
    stars: true,
  },
};

export function phaseForHour(hour: number): Phase {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

export function atmosphereNow(now: Date = new Date()): Atmosphere {
  return ATMOSPHERES[phaseForHour(now.getHours())];
}
