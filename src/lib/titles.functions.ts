import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type TitleRow = Database["public"]["Tables"]["titles"]["Row"];
export type PlayerTitleRow = Database["public"]["Tables"]["player_titles"]["Row"];
export type TitleRarity = Database["public"]["Enums"]["title_rarity"];
export type TitleCategory = Database["public"]["Enums"]["title_category"];
export type TitleUnlockType = Database["public"]["Enums"]["title_unlock_type"];

export type PlayerTitleWithDef = PlayerTitleRow & { titles: TitleRow };

// ---- Public: list all visible titles + user's unlocked ids ----
export const listTitles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [{ data: titles, error: tErr }, { data: owned, error: oErr }] = await Promise.all([
      sb.from("titles").select("*").eq("active", true).order("display_order").order("name"),
      sb
        .from("player_titles")
        .select("title_id, equipped, unlocked_at, source")
        .eq("user_id", context.userId),
    ]);
    if (tErr) throw tErr;
    if (oErr) throw oErr;
    return { titles: titles ?? [], owned: owned ?? [] };
  });

// ---- Player's owned titles with definitions ----
export const getMyTitles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("player_titles")
      .select("*, titles(*)")
      .eq("user_id", context.userId)
      .order("unlocked_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as PlayerTitleWithDef[];
  });

// ---- Equipped title for any user id (read-through, safe) ----
export const getEquippedTitle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("player_titles")
      .select("*, titles(*)")
      .eq("user_id", context.userId)
      .eq("equipped", true)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as PlayerTitleWithDef | null;
  });

// ---- Evaluate & return newly unlocked ----
export const evaluateMyTitles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("evaluate_titles_for_user", {
      _user_id: context.userId,
    });
    if (error) throw error;
    return (data ?? []) as Array<{
      id: string;
      slug: string;
      name: string;
      description: string;
      rarity: TitleRarity;
      category: TitleCategory;
      icon: string;
      color: string;
    }>;
  });

// ---- Equip / unequip ----
export const equipTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ titleId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("equip_title", { _title_id: data.titleId });
    if (error) throw error;
    return { ok: true };
  });

export const unequipMyTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.rpc("unequip_all_titles");
    if (error) throw error;
    return { ok: true };
  });

// ===================== FOUNDER =====================
const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";
function assertFounder(claims: unknown) {
  const email = (claims as { email?: string } | undefined)?.email?.toLowerCase();
  if (email !== FOUNDER_EMAIL) throw new Error("Forbidden");
}

// Founder: list all titles including hidden/archived.
export const founderListTitles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertFounder(context.claims);
    const { data, error } = await context.supabase
      .from("titles")
      .select("*")
      .order("display_order")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const TitleUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(280).default(""),
  category: z.enum([
    "explorer", "adventure", "completion", "founder",
    "seasonal", "event", "special", "community", "hidden",
  ]),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary", "mythic"]),
  icon: z.string().max(8).default("🏷️"),
  color: z.string().max(60).default("oklch(0.72 0.16 300)"),
  unlock_type: z.enum([
    "reach_level", "quest_count", "specific_quest",
    "pioneer", "founder", "manual", "event",
  ]),
  unlock_requirement: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
  display_order: z.number().int().min(0).max(9999).default(0),
  hidden: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const founderSaveTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => TitleUpsertSchema.parse(raw))
  .handler(async ({ context, data }) => {
    assertFounder(context.claims);
    const payload = { ...data, created_by: context.userId };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("titles")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("titles")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

export const founderArchiveTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(raw))
  .handler(async ({ context, data }) => {
    assertFounder(context.claims);
    const { error } = await context.supabase
      .from("titles")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const founderSearchPlayers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ q: z.string().max(60).default("") }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    assertFounder(context.claims);
    let q = context.supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_pioneer, pioneer_number")
      .limit(20);
    if (data.q.trim()) {
      const s = `%${data.q.trim()}%`;
      q = q.or(`display_name.ilike.${s},username.ilike.${s}`);
    }
    const { data: rows, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const founderAssignTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ userId: z.string().uuid(), titleId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    assertFounder(context.claims);
    const { error } = await context.supabase.rpc("assign_title", {
      _user_id: data.userId,
      _title_id: data.titleId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const founderRemoveTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ userId: z.string().uuid(), titleId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    assertFounder(context.claims);
    const { error } = await context.supabase.rpc("remove_title", {
      _user_id: data.userId,
      _title_id: data.titleId,
    });
    if (error) throw error;
    return { ok: true };
  });
