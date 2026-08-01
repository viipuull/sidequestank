/** Smart variables shared by the template library, previews and the sender. */

export const SMART_VARIABLES = [
  "player_name", "username", "level", "xp", "xp_remaining",
  "quest_name", "quest_id", "objective_name", "badge", "title",
  "rank", "collection", "city", "event_name", "reason",
  "attempts_left", "reviewer",
] as const;

export type SmartVariable = (typeof SMART_VARIABLES)[number];
export type VariableBag = Partial<Record<string, string | number | null | undefined>>;

/** Replaces {{var}} placeholders. Unknown/blank values fall back to sane text. */
export function interpolate(input: string, bag: VariableBag = {}): string {
  if (!input) return "";
  return input.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, key: string) => {
    const value = bag[key.toLowerCase()];
    if (value === undefined || value === null || value === "") return FALLBACKS[key.toLowerCase()] ?? "";
    return String(value);
  });
}

const FALLBACKS: Record<string, string> = {
  player_name: "Explorer",
  username: "explorer",
  level: "1",
  xp: "0",
  xp_remaining: "0",
  quest_name: "your quest",
  objective_name: "the objective",
  badge: "",
  title: "",
  rank: "—",
  collection: "your collection",
  city: "Ankleshwar",
  event_name: "the event",
  reason: "not specified",
  attempts_left: "1",
  reviewer: "the SideQuest team",
};

/** Deterministic-ish random pick so recurring notifications never feel repetitive. */
export function pickVariation(base: string, variations: string[] | null | undefined): string {
  const pool = [base, ...(variations ?? [])].filter(Boolean);
  if (pool.length <= 1) return base;
  return pool[Math.floor(Math.random() * pool.length)] as string;
}

export function usedVariables(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)) out.add((m[1] as string).toLowerCase());
  return [...out];
}