import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listTitles, getMyTitles, getEquippedTitle, evaluateMyTitles,
  equipTitle, unequipMyTitle,
} from "@/lib/titles.functions";

export function useTitlesCatalog(enabled = true) {
  const fn = useServerFn(listTitles);
  return useQuery({ queryKey: ["titles-catalog"], enabled, queryFn: () => fn() });
}

export function useMyTitles(enabled = true) {
  const fn = useServerFn(getMyTitles);
  return useQuery({ queryKey: ["my-titles"], enabled, queryFn: () => fn() });
}

export function useEquippedTitle(enabled = true) {
  const fn = useServerFn(getEquippedTitle);
  return useQuery({ queryKey: ["equipped-title"], enabled, queryFn: () => fn(), staleTime: 20_000 });
}

export function useEvaluateTitles() {
  const fn = useServerFn(evaluateMyTitles);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fn(),
    onSuccess: (unlocked) => {
      if (unlocked.length > 0) {
        qc.invalidateQueries({ queryKey: ["my-titles"] });
        qc.invalidateQueries({ queryKey: ["titles-catalog"] });
        qc.invalidateQueries({ queryKey: ["equipped-title"] });
      }
    },
  });
}

export function useEquipTitle() {
  const fn = useServerFn(equipTitle);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (titleId: string) => fn({ data: { titleId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-titles"] });
      qc.invalidateQueries({ queryKey: ["equipped-title"] });
      qc.invalidateQueries({ queryKey: ["titles-catalog"] });
    },
  });
}

export function useUnequipTitle() {
  const fn = useServerFn(unequipMyTitle);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-titles"] });
      qc.invalidateQueries({ queryKey: ["equipped-title"] });
    },
  });
}

export const RARITY_STYLES: Record<string, { label: string; ring: string; glow: string; bg: string; text: string }> = {
  common:    { label: "Common",    ring: "border-border",                              glow: "0 0 12px oklch(0.7 0.02 260 / 0.15)",  bg: "oklch(0.28 0.02 260 / 0.4)", text: "oklch(0.85 0.02 260)" },
  uncommon:  { label: "Uncommon",  ring: "border-emerald-400/40",                      glow: "0 0 16px oklch(0.78 0.14 155 / 0.3)",   bg: "oklch(0.32 0.10 155 / 0.35)", text: "oklch(0.85 0.14 155)" },
  rare:      { label: "Rare",      ring: "border-sky-400/45",                          glow: "0 0 20px oklch(0.72 0.16 220 / 0.4)",  bg: "oklch(0.32 0.12 220 / 0.35)", text: "oklch(0.85 0.14 220)" },
  epic:      { label: "Epic",      ring: "border-fuchsia-400/50",                      glow: "0 0 24px oklch(0.72 0.20 300 / 0.5)",  bg: "oklch(0.34 0.14 300 / 0.35)", text: "oklch(0.86 0.17 300)" },
  legendary: { label: "Legendary", ring: "border-amber-300/60",                        glow: "0 0 30px oklch(0.85 0.18 75 / 0.55)",  bg: "oklch(0.38 0.14 75 / 0.35)",  text: "oklch(0.9 0.16 75)" },
  mythic:    { label: "Mythic",    ring: "border-rose-300/70",                         glow: "0 0 36px oklch(0.82 0.20 15 / 0.65)",  bg: "oklch(0.36 0.16 15 / 0.4)",   text: "oklch(0.88 0.18 15)" },
};
