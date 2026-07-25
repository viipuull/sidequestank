import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlayerProgress = {
  user_id: string;
  current_level: number;
  lifetime_xp: number;
  current_level_xp: number;
  xp_for_next_level: number;
  total_quests_completed: number;
  level_up_date: string | null;
  next_level_threshold: number;
  current_level_threshold: number;
};

export const getMyProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlayerProgress> => {
    const sb = context.supabase;
    // Ensure a row exists (idempotent no-op for existing users)
    await sb.from("player_progress").upsert(
      { user_id: context.userId },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    const { data, error } = await sb
      .from("player_progress")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    const row = data ?? {
      user_id: context.userId,
      current_level: 1,
      lifetime_xp: 0,
      current_level_xp: 0,
      xp_for_next_level: 100,
      total_quests_completed: 0,
      level_up_date: null,
    };
    const { data: curThr } = await sb.rpc("xp_required_for_level", { _level: row.current_level });
    const { data: nextThr } = await sb.rpc("xp_required_for_level", { _level: row.current_level + 1 });
    return {
      ...row,
      current_level_threshold: (curThr as number) ?? 0,
      next_level_threshold: (nextThr as number) ?? 100,
    };
  });

export const getMyXpHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      limit: z.number().int().min(1).max(100).default(30),
      offset: z.number().int().min(0).max(10000).default(0),
    }).parse(raw ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("xp_events")
      .select("id, xp_earned, reason, created_at, quest_id, session_id, quests(title, slug, category, difficulty)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (error) throw error;
    return rows ?? [];
  });
