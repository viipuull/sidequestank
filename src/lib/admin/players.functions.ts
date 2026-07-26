import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminPlayerRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  city: string;
  level: number;
  xp: number;
  is_pioneer: boolean;
  pioneer_number: number | null;
  suspended_at: string | null;
  moderation_hidden: boolean;
  is_founder: boolean;
  quests_completed: number;
  last_active_at: string | null;
  created_at: string;
};

export type PlayerListFilters = {
  search?: string;
  city?: string;
  minLevel?: number;
  onlySuspended?: boolean;
  onlyHidden?: boolean;
  onlyPioneer?: boolean;
  onlyFounder?: boolean;
  limit?: number;
  offset?: number;
};

export const listPlayers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PlayerListFilters) => input ?? {})
  .handler(async ({ data, context }): Promise<AdminPlayerRow[]> => {
    const { data: rows, error } = await context.supabase.rpc("admin_list_players", {
      _search: data.search ?? null,
      _city: data.city ?? null,
      _min_level: data.minLevel ?? null,
      _only_suspended: data.onlySuspended ?? null,
      _only_hidden: data.onlyHidden ?? null,
      _only_pioneer: data.onlyPioneer ?? null,
      _only_founder: data.onlyFounder ?? null,
      _limit: data.limit ?? 50,
      _offset: data.offset ?? 0,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as AdminPlayerRow[];
  });

export const getPlayerDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => ({ userId: String(input.userId) }))
  .handler(async ({ data, context }) => {
    const { data: detail, error } = await context.supabase.rpc("admin_get_player", { _user_id: data.userId });
    if (error) throw new Error(error.message);
    // Also fetch email via admin API
    let email: string | null = null;
    let last_sign_in_at: string | null = null;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      email = u?.user?.email ?? null;
      last_sign_in_at = u?.user?.last_sign_in_at ?? null;
    } catch { /* ignore */ }
    return { ...(detail as Record<string, unknown>), email, last_sign_in_at };
  });

function rpc(name: string) {
  return createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((input: Record<string, unknown>) => input ?? {})
    .handler(async ({ data, context }) => {
      const { data: res, error } = await (context.supabase as any).rpc(name, data);
      if (error) throw new Error(error.message);
      return res;
    });
}

export const suspendPlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { userId: string; reason: string }) => ({ userId: String(i.userId), reason: String(i.reason ?? "") }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_suspend_player", { _user_id: data.userId, _reason: data.reason });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const restorePlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { userId: string }) => ({ userId: String(i.userId) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_restore_player", { _user_id: data.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setProfileHidden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { userId: string; hidden: boolean }) => ({ userId: String(i.userId), hidden: Boolean(i.hidden) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_set_profile_hidden", { _user_id: data.userId, _hidden: data.hidden });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adjustXp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { userId: string; delta: number; reason: string }) => ({
    userId: String(i.userId),
    delta: Number(i.delta),
    reason: String(i.reason ?? ""),
  }))
  .handler(async ({ data, context }) => {
    const { data: res, error } = await context.supabase.rpc("admin_adjust_xp", {
      _user_id: data.userId, _delta: data.delta, _reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return res;
  });

export const grantTitleToPlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { userId: string; titleId: string }) => ({ userId: String(i.userId), titleId: String(i.titleId) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_grant_title", { _user_id: data.userId, _title_id: data.titleId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeTitleFromPlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { userId: string; titleId: string }) => ({ userId: String(i.userId), titleId: String(i.titleId) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_revoke_title", { _user_id: data.userId, _title_id: data.titleId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const grantAchievementToPlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { userId: string; achievementId: string }) => ({ userId: String(i.userId), achievementId: String(i.achievementId) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_grant_achievement", { _user_id: data.userId, _achievement_id: data.achievementId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeAchievementFromPlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { userId: string; achievementId: string }) => ({ userId: String(i.userId), achievementId: String(i.achievementId) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_revoke_achievement", { _user_id: data.userId, _achievement_id: data.achievementId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetQuestSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { sessionId: string }) => ({ sessionId: String(i.sessionId) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_reset_quest_session", { _session_id: data.sessionId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetEventProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { userId: string; eventId: string }) => ({ userId: String(i.userId), eventId: String(i.eventId) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_reset_event_progress", { _user_id: data.userId, _event_id: data.eventId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Titles list for picker
export const listAllTitles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("titles").select("id, name, slug, rarity, category").eq("active", true).order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAllAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("achievements").select("id, name, slug, rarity, category").eq("active", true).order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });