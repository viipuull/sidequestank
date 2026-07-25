import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type AchievementRow = Database["public"]["Tables"]["achievements"]["Row"];
export type PlayerAchievementRow = Database["public"]["Tables"]["player_achievements"]["Row"];
export type AchievementRarity = Database["public"]["Enums"]["achievement_rarity"];

export type PlayerAchievementWithDef = PlayerAchievementRow & { achievements: AchievementRow };

export type UnlockedAchievement = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string | null;
  rarity: AchievementRarity;
  category: string;
  badge_image_url: string | null;
  xp_bonus: number;
};

// ---- Public list: all visible achievements + user's rows ----
export const listAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [{ data: achievements, error: aErr }, { data: mine, error: mErr }] = await Promise.all([
      sb.from("achievements").select("*").eq("active", true).order("display_order").order("name"),
      sb.from("player_achievements").select("*").eq("user_id", context.userId),
    ]);
    if (aErr) throw aErr;
    if (mErr) throw mErr;
    return { achievements: achievements ?? [], mine: mine ?? [] };
  });

// ---- Player's owned achievements with definitions ----
export const getMyAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("player_achievements")
      .select("*, achievements(*)")
      .eq("user_id", context.userId)
      .order("completed_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as PlayerAchievementWithDef[];
  });

// ---- Single achievement detail ----
export const getAchievementBySlug = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ slug: z.string().min(1) }).parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const { data: def, error } = await sb
      .from("achievements")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    if (!def) return null;
    const { data: mine } = await sb
      .from("player_achievements")
      .select("*")
      .eq("user_id", context.userId)
      .eq("achievement_id", def.id)
      .maybeSingle();
    return { achievement: def, mine: mine ?? null };
  });

// ---- Evaluate & return newly unlocked ----
export const evaluateMyAchievements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("evaluate_achievements_for_user", {
      _user_id: context.userId,
    });
    if (error) throw error;
    return (data ?? []) as unknown as UnlockedAchievement[];
  });

// ---- Pin / unpin ----
const MAX_FEATURED = 6;
export const toggleFeaturedAchievement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ playerAchievementId: z.string().uuid(), featured: z.boolean() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    if (data.featured) {
      // Enforce cap
      const { count } = await sb
        .from("player_achievements")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .eq("featured", true);
      if ((count ?? 0) >= MAX_FEATURED) {
        throw new Error(`You can feature up to ${MAX_FEATURED} badges. Unpin one first.`);
      }
    }
    const { error } = await sb
      .from("player_achievements")
      .update({
        featured: data.featured,
        featured_order: data.featured ? Math.floor(Date.now() / 1000) : 0,
      })
      .eq("id", data.playerAchievementId)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const reorderFeaturedAchievements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ orderedIds: z.array(z.string().uuid()).max(MAX_FEATURED) }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    for (let i = 0; i < data.orderedIds.length; i += 1) {
      await sb
        .from("player_achievements")
        .update({ featured_order: (data.orderedIds.length - i) * 10, featured: true })
        .eq("id", data.orderedIds[i])
        .eq("user_id", context.userId);
    }
    return { ok: true };
  });

// ===================== FOUNDER =====================
async function assertFounder(sb: SupabaseClient<Database>, userId: string) {
  const { data } = await sb.rpc("has_role", { _user_id: userId, _role: "founder" });
  if (!data) throw new Error("Forbidden");
}

export const founderListAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("achievements")
      .select("*")
      .order("display_order")
      .order("name");
    if (error) throw error;
    return data ?? [];
  });

const achievementSaveSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  name: z.string().min(1).max(80),
  description: z.string().max(500).default(""),
  badge_image_url: z.string().url().nullable().optional(),
  icon: z.string().min(1).max(8).default("🏅"),
  color: z.string().nullable().optional(),
  category: z.string().min(1).max(40),
  difficulty: z.string().min(1).max(20),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary", "mythic"]),
  unlock_type: z.string().min(1).max(40),
  unlock_requirement: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
  goal_target: z.number().int().min(1).max(100000).default(1),
  hidden: z.boolean().default(false),
  secret: z.boolean().default(false),
  active: z.boolean().default(true),
  xp_bonus: z.number().int().min(0).max(100000).default(0),
  display_order: z.number().int().min(0).max(100000).default(100),
});

export const founderSaveAchievement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => achievementSaveSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context.supabase, context.userId);
    const sb = context.supabase;
    if (data.id) {
      const { data: row, error } = await sb
        .from("achievements")
        .update({ ...data })
        .eq("id", data.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await sb
      .from("achievements")
      .insert({ ...data, created_by: context.userId })
      .select()
      .maybeSingle();
    if (error) throw error;
    return row;
  });

export const founderArchiveAchievement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    await assertFounder(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("achievements")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const founderDuplicateAchievement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context.supabase, context.userId);
    const sb = context.supabase;
    const { data: src, error } = await sb.from("achievements").select("*").eq("id", data.id).maybeSingle();
    if (error) throw error;
    if (!src) throw new Error("Not found");
    const newSlug = `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;
    const { data: row, error: iErr } = await sb
      .from("achievements")
      .insert({
        slug: newSlug,
        name: `${src.name} (Copy)`,
        description: src.description,
        badge_image_url: src.badge_image_url,
        icon: src.icon,
        color: src.color,
        category: src.category,
        difficulty: src.difficulty,
        rarity: src.rarity,
        unlock_type: src.unlock_type,
        unlock_requirement: src.unlock_requirement,
        goal_target: src.goal_target,
        hidden: src.hidden,
        secret: src.secret,
        active: false,
        xp_bonus: src.xp_bonus,
        display_order: src.display_order,
        created_by: context.userId,
      })
      .select()
      .maybeSingle();
    if (iErr) throw iErr;
    return row;
  });

export const founderAssignAchievement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ userId: z.string().uuid(), achievementId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    await assertFounder(context.supabase, context.userId);
    const { data: res, error } = await context.supabase.rpc("founder_assign_achievement", {
      _user_id: data.userId,
      _achievement_id: data.achievementId,
    });
    if (error) throw error;
    return res;
  });

export const founderSearchPlayers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ q: z.string().max(80).default("") }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context.supabase, context.userId);
    const q = data.q.trim();
    let query = context.supabase.from("profiles").select("id, username, display_name, avatar_url").limit(20);
    if (q.length > 0) query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
    const { data: rows, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });