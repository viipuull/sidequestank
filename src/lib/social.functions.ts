import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const sel = (s: string): string => s;

export type SocialSettings = Database["public"]["Tables"]["player_social_settings"]["Row"];
export type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ActivityEvent = Database["public"]["Tables"]["activity_events"]["Row"];
export type LeaderboardRow = Database["public"]["Tables"]["leaderboard_snapshots"]["Row"];

function serverPublicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

// -------- My social settings --------
export const getMySocialSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SocialSettings> => {
    const sb = context.supabase;
    await sb.from("player_social_settings").upsert(
      { user_id: context.userId },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    const { data, error } = await sb
      .from("player_social_settings").select("*").eq("user_id", context.userId).maybeSingle();
    if (error) throw error;
    return data as SocialSettings;
  });

const socialUpdate = z.object({
  public_profile: z.boolean().optional(),
  show_stats: z.boolean().optional(),
  show_achievements: z.boolean().optional(),
  show_collections: z.boolean().optional(),
  show_titles: z.boolean().optional(),
  show_level: z.boolean().optional(),
  show_xp: z.boolean().optional(),
  appear_on_leaderboard: z.boolean().optional(),
  allow_friend_requests: z.boolean().optional(),
  allow_followers: z.boolean().optional(),
  bio: z.string().max(280).nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
});

export const updateMySocialSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => socialUpdate.parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("player_social_settings")
      .update(data).eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// -------- Public profile --------
export type PublicProfile = {
  profile: Pick<ProfileRow,"id"|"username"|"display_name"|"avatar_url"|"city"|"is_pioneer"|"pioneer_number"|"level"|"xp"|"created_at">;
  settings: Pick<SocialSettings,"public_profile"|"show_stats"|"show_achievements"|"show_collections"|"show_titles"|"show_level"|"show_xp"|"bio"|"banner_url"|"moderation_hidden">;
  stats: PlayerStatsRow | null;
  equipped_title: { id: string; name: string; slug: string; rarity: string; color: string; icon: string } | null;
  featured_badges: Array<{ id: string; slug: string; name: string; icon: string; color: string; rarity: string; badge_image_url: string | null }>;
  recent_activity: ActivityEvent[];
  global_rank: number | null;
  city_rank: number | null;
};

export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ username: z.string().min(1) }).parse(raw))
  .handler(async ({ data }): Promise<PublicProfile | null> => {
    const sb = serverPublicClient();
    const { data: profile } = await sb.from("profiles").select("*")
      .ilike("username", data.username).maybeSingle();
    if (!profile) return null;
    const { data: settings } = await sb.from("player_social_settings")
      .select("*").eq("user_id", profile.id).maybeSingle();
    if (!settings || !settings.public_profile || settings.moderation_hidden) return null;
    const { data: stats } = await sb.from("player_stats").select("*").eq("user_id", profile.id).maybeSingle();
    const { data: titleRow } = await sb.from("player_titles")
      .select(sel("titles(id, name, slug, rarity, color, icon)"))
      .eq("user_id", profile.id).eq("equipped", true).maybeSingle();
    const equipped_title = ((titleRow as unknown as { titles: PublicProfile["equipped_title"] } | null)?.titles) ?? null;
    const { data: badges } = await sb.from("player_achievements")
      .select(sel("featured, achievements(id, slug, name, icon, color, rarity, badge_image_url)"))
      .eq("user_id", profile.id).eq("completed", true).eq("featured", true)
      .order("featured_order", { ascending: true }).limit(6);
    const featured_badges = ((badges ?? []) as unknown as Array<{ achievements: PublicProfile["featured_badges"][number] }>)
      .map((b) => b.achievements).filter(Boolean);
    const { data: activity } = await sb.from("activity_events")
      .select("*").eq("user_id", profile.id).eq("visibility","public")
      .order("created_at", { ascending: false }).limit(20);
    const { data: g } = await sb.from("leaderboard_snapshots").select("rank")
      .eq("scope","global").eq("period","all_time").eq("period_key","all")
      .eq("user_id", profile.id).maybeSingle();
    const { data: c } = await sb.from("leaderboard_snapshots").select("rank")
      .eq("scope","city").eq("scope_key", (profile.city ?? "").toLowerCase())
      .eq("period","all_time").eq("period_key","all").eq("user_id", profile.id).maybeSingle();
    return {
      profile,
      settings,
      stats: stats ?? null,
      equipped_title,
      featured_badges,
      recent_activity: (activity ?? []) as ActivityEvent[],
      global_rank: g?.rank ?? null,
      city_rank: c?.rank ?? null,
    };
  });

// -------- Discover players --------
export type PlayerCard = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  city: string;
  level: number;
  total_xp: number;
  quests_completed: number;
  collections_completed: number;
  achievements_earned: number;
  titles_earned: number;
  last_active_at: string | null;
  join_date: string;
  equipped_title: { name: string; color: string; icon: string; rarity: string } | null;
};

const discoverInput = z.object({
  query: z.string().max(80).optional(),
  sort: z.enum(["top_xp","top_level","most_collections","most_achievements","most_active","newest"]).default("top_xp"),
  city: z.string().max(60).optional(),
  limit: z.number().int().min(1).max(48).default(24),
  offset: z.number().int().min(0).max(5000).default(0),
});

export const discoverPlayers = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => discoverInput.parse(raw ?? {}))
  .handler(async ({ data }): Promise<PlayerCard[]> => {
    const sb = serverPublicClient();
    let q = sb.from("player_stats")
      .select(sel("*, profiles!inner(id, username, display_name, avatar_url, city), player_social_settings!inner(public_profile, moderation_hidden)"))
      .eq("player_social_settings.public_profile", true)
      .eq("player_social_settings.moderation_hidden", false);
    switch (data.sort) {
      case "top_level": q = q.order("level", { ascending: false }).order("total_xp", { ascending: false }); break;
      case "most_collections": q = q.order("collections_completed", { ascending: false }); break;
      case "most_achievements": q = q.order("achievements_earned", { ascending: false }); break;
      case "most_active": q = q.order("last_active_at", { ascending: false, nullsFirst: false }); break;
      case "newest": q = q.order("join_date", { ascending: false }); break;
      default: q = q.order("total_xp", { ascending: false }).order("level", { ascending: false });
    }
    if (data.city) q = q.ilike("profiles.city", data.city);
    if (data.query) q = q.or(`username.ilike.%${data.query}%,display_name.ilike.%${data.query}%`, { referencedTable: "profiles" });
    q = q.range(data.offset, data.offset + data.limit - 1);
    const { data: rows, error } = await q;
    if (error) throw error;
    const ids = (rows ?? []).map((r) => (r as unknown as { user_id: string }).user_id);
    const titleMap = new Map<string, PlayerCard["equipped_title"]>();
    if (ids.length) {
      const { data: t } = await sb.from("player_titles")
        .select(sel("user_id, titles(name, color, icon, rarity)"))
        .in("user_id", ids).eq("equipped", true);
      for (const row of (t ?? []) as unknown as Array<{ user_id: string; titles: PlayerCard["equipped_title"] }>) {
        titleMap.set(row.user_id, row.titles);
      }
    }
    return (rows ?? []).map((r) => {
      const row = r as unknown as PlayerStatsRow & { profiles: { id: string; username: string; display_name: string; avatar_url: string | null; city: string } };
      return {
        user_id: row.user_id,
        username: row.profiles.username,
        display_name: row.profiles.display_name,
        avatar_url: row.profiles.avatar_url,
        city: row.profiles.city,
        level: row.level,
        total_xp: row.total_xp,
        quests_completed: row.quests_completed,
        collections_completed: row.collections_completed,
        achievements_earned: row.achievements_earned,
        titles_earned: row.titles_earned,
        last_active_at: row.last_active_at,
        join_date: row.join_date,
        equipped_title: titleMap.get(row.user_id) ?? null,
      };
    });
  });

// -------- Featured players --------
export const listFeaturedPlayers = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublicClient();
  const { data } = await sb.from("featured_players")
    .select(sel("id, blurb, priority, user_id, profiles(id, username, display_name, avatar_url, city, level, xp)"))
    .eq("active", true).order("priority", { ascending: false }).order("created_at", { ascending: false });
  return (data ?? []) as unknown as Array<{
    id: string; blurb: string; priority: number; user_id: string;
    profiles: { id: string; username: string; display_name: string; avatar_url: string | null; city: string; level: number; xp: number };
  }>;
});

// -------- Compare --------
export const comparePlayers = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ usernameA: z.string().min(1), usernameB: z.string().min(1) }).parse(raw))
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const [{ data: a }, { data: b }] = await Promise.all([
      sb.from("profiles").select("id, username, display_name, avatar_url, city").ilike("username", data.usernameA).maybeSingle(),
      sb.from("profiles").select("id, username, display_name, avatar_url, city").ilike("username", data.usernameB).maybeSingle(),
    ]);
    if (!a || !b) return null;
    const [{ data: sa }, { data: sb2 }] = await Promise.all([
      sb.from("player_stats").select("*").eq("user_id", a.id).maybeSingle(),
      sb.from("player_stats").select("*").eq("user_id", b.id).maybeSingle(),
    ]);
    return { a: { profile: a, stats: sa }, b: { profile: b, stats: sb2 } };
  });

// -------- Founder: moderation & featured --------
type Ctx = { supabase: { rpc: (name: "has_role", args: { _user_id: string; _role: "founder" }) => Promise<{ data: unknown }> } };
async function assertFounder(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "founder" });
  if (!data) throw new Error("Forbidden");
}

export const founderModerateVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ user_id: z.string().uuid(), hidden: z.boolean() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { error } = await context.supabase.from("player_social_settings")
      .update({ moderation_hidden: data.hidden }).eq("user_id", data.user_id);
    if (error) throw error;
    return { ok: true };
  });

export const founderSetFeatured = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    user_id: z.string().uuid(), blurb: z.string().max(200).default(""),
    priority: z.number().int().min(0).max(1000).default(0), active: z.boolean().default(true),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { error } = await context.supabase.from("featured_players")
      .upsert({ user_id: data.user_id, blurb: data.blurb, priority: data.priority, active: data.active, created_by: context.userId },
        { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });

export const founderRemoveFeatured = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ user_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { error } = await context.supabase.from("featured_players").delete().eq("user_id", data.user_id);
    if (error) throw error;
    return { ok: true };
  });

export const founderSearchUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ query: z.string().min(1).max(60) }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { data: rows } = await context.supabase.from("profiles")
      .select("id, username, display_name, avatar_url, city")
      .or(`username.ilike.%${data.query}%,display_name.ilike.%${data.query}%`)
      .limit(20);
    return rows ?? [];
  });

export const founderRecomputeLeaderboards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context);
    const { error } = await context.supabase.rpc("recompute_default_leaderboards" as never);
    if (error) throw error;
    return { ok: true };
  });

export const listSeasons = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublicClient();
  const { data } = await sb.from("leaderboard_seasons").select("*").order("starts_at", { ascending: false });
  return data ?? [];
});

export const founderCreateSeason = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    name: z.string().min(2).max(60), slug: z.string().min(2).max(60),
    starts_at: z.string().optional(), ends_at: z.string().nullable().optional(),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    await context.supabase.from("leaderboard_seasons").update({ active: false }).eq("active", true);
    const { error } = await context.supabase.from("leaderboard_seasons").insert({
      name: data.name, slug: data.slug,
      starts_at: data.starts_at ?? new Date().toISOString(),
      ends_at: data.ends_at ?? null, active: true, created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });
