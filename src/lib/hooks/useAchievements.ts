import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listAchievements,
  getMyAchievements,
  getAchievementBySlug,
  evaluateMyAchievements,
  toggleFeaturedAchievement,
  reorderFeaturedAchievements,
} from "@/lib/achievements.functions";

export function useAchievementsCatalog(enabled = true) {
  const fn = useServerFn(listAchievements);
  return useQuery({ queryKey: ["achievements-catalog"], enabled, queryFn: () => fn() });
}

export function useMyAchievements(enabled = true) {
  const fn = useServerFn(getMyAchievements);
  return useQuery({ queryKey: ["my-achievements"], enabled, queryFn: () => fn() });
}

export function useAchievementDetail(slug: string, enabled = true) {
  const fn = useServerFn(getAchievementBySlug);
  return useQuery({
    queryKey: ["achievement-detail", slug],
    enabled: enabled && !!slug,
    queryFn: () => fn({ data: { slug } }),
  });
}

export function useEvaluateAchievements() {
  const fn = useServerFn(evaluateMyAchievements);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fn(),
    onSuccess: (unlocked) => {
      if (unlocked && unlocked.length > 0) {
        qc.invalidateQueries({ queryKey: ["my-achievements"] });
        qc.invalidateQueries({ queryKey: ["achievements-catalog"] });
      }
    },
  });
}

export function useToggleFeatured() {
  const fn = useServerFn(toggleFeaturedAchievement);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { playerAchievementId: string; featured: boolean }) => fn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-achievements"] });
      qc.invalidateQueries({ queryKey: ["achievements-catalog"] });
    },
  });
}

export function useReorderFeatured() {
  const fn = useServerFn(reorderFeaturedAchievements);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => fn({ data: { orderedIds } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-achievements"] }),
  });
}

export const MAX_FEATURED_BADGES = 6;