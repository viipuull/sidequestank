import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProgress, getMyXpHistory } from "@/lib/progression.functions";

export function useMyProgress(enabled = true) {
  const fn = useServerFn(getMyProgress);
  return useQuery({
    queryKey: ["my-progress"],
    enabled,
    queryFn: () => fn({}),
    staleTime: 15_000,
  });
}

export function useMyXpHistory(limit = 30, enabled = true) {
  const fn = useServerFn(getMyXpHistory);
  return useQuery({
    queryKey: ["my-xp-history", limit],
    enabled,
    queryFn: () => fn({ data: { limit, offset: 0 } }),
  });
}
