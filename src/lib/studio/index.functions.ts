import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { escapePostgrestLike } from "@/lib/postgrest";

// Shared founder gate.
async function assertFounder(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .rpc("has_role", { _user_id: ctx.userId, _role: "founder" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export type StudioHomeStats = {
  players_total: number;
  players_active_today: number;
  players_new_today: number;
  quests_completed_today: number;
  xp_earned_today: number;
  collections_completed_today: number;
  achievements_earned_today: number;
  quests_published_total: number;
  events_live: number;
};

export type StudioHomeSnapshot = {
  stats: StudioHomeStats;
  upcoming_events: Array<{ id: string; slug: string; name: string; icon: string; starts_at: string; ends_at: string | null; status: string; event_type: string }>;
  recent_quests: Array<{ id: string; slug: string; title: string; city: string; published_at: string | null; status: string }>;
  recent_notifications: Array<{ id: string; title: string; body: string; kind: string; created_at: string }>;
  recent_audit: Array<{ id: string; actor_email: string | null; action: string; target_kind: string; summary: string | null; created_at: string }>;
};

export const getStudioHome = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudioHomeSnapshot> => {
    await assertFounder(context);
    const sb = context.supabase;
    const todayIso = new Date();
    todayIso.setUTCHours(0, 0, 0, 0);
    const since = todayIso.toISOString();

    const cx = { count: "exact" as const, head: true };

    const [
      profTotal,
      profNew,
      sessActive,
      sessDone,
      xpToday,
      collDone,
      achDone,
      questsPub,
      eventsLive,
      upcoming,
      recentQuests,
      recentNotifs,
      recentAudit,
    ] = await Promise.all([
      sb.from("profiles").select("*", cx),
      sb.from("profiles").select("*", cx).gte("created_at", since),
      sb.from("quest_sessions").select("*", cx).gte("last_activity_at", since),
      sb.from("quest_sessions").select("*", cx).eq("status", "completed").gte("completed_at", since),
      sb.from("xp_events").select("xp_earned").gte("created_at", since),
      sb.from("player_collections").select("*", cx).eq("completed", true).gte("completed_at", since),
      sb.from("player_achievements").select("*", cx).eq("completed", true).gte("completed_at", since),
      sb.from("quests").select("*", cx).eq("status", "published"),
      sb.from("events").select("*", cx).eq("status", "live"),
      sb.from("events").select("id, slug, name, icon, starts_at, ends_at, status, event_type")
        .in("status", ["scheduled", "live"]).order("starts_at", { ascending: true }).limit(6),
      sb.from("quests").select("id, slug, title, city, published_at, status")
        .eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(6),
      sb.from("notifications").select("id, title, body, kind, created_at")
        .order("created_at", { ascending: false }).limit(6),
      sb.from("audit_events").select("id, actor_email, action, target_kind, summary, created_at")
        .order("created_at", { ascending: false }).limit(6),
    ]);

    const xp_earned_today = (xpToday.data ?? []).reduce((acc: number, r: any) => acc + (r.xp_earned ?? 0), 0);

    return {
      stats: {
        players_total: profTotal.count ?? 0,
        players_active_today: sessActive.count ?? 0,
        players_new_today: profNew.count ?? 0,
        quests_completed_today: sessDone.count ?? 0,
        xp_earned_today,
        collections_completed_today: collDone.count ?? 0,
        achievements_earned_today: achDone.count ?? 0,
        quests_published_total: questsPub.count ?? 0,
        events_live: eventsLive.count ?? 0,
      },
      upcoming_events: (upcoming.data ?? []) as any,
      recent_quests: (recentQuests.data ?? []) as any,
      recent_notifications: (recentNotifs.data ?? []) as any,
      recent_audit: (recentAudit.data ?? []) as any,
    };
  });

export type StudioSearchResult = {
  players: Array<{ id: string; username: string; display_name: string; avatar_url: string | null }>;
  quests: Array<{ id: string; slug: string; title: string; status: string }>;
  collections: Array<{ id: string; slug: string; name: string; status: string }>;
  events: Array<{ id: string; slug: string; name: string; status: string }>;
  achievements: Array<{ id: string; slug: string; name: string }>;
  titles: Array<{ id: string; slug: string; name: string }>;
};

export const studioSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q: string }) => z.object({ q: z.string().trim().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }): Promise<StudioSearchResult> => {
    await assertFounder(context);
    const sb = context.supabase;
    const like = escapePostgrestLike(data.q);
    const [players, quests, collections, events, achievements, titles] = await Promise.all([
      sb.from("profiles").select("id, username, display_name, avatar_url")
        .or(`username.ilike.${like},display_name.ilike.${like}`).limit(8),
      sb.from("quests").select("id, slug, title, status")
        .or(`title.ilike.${like},slug.ilike.${like}`).limit(8),
      sb.from("collections").select("id, slug, name, status")
        .or(`name.ilike.${like},slug.ilike.${like}`).limit(6),
      sb.from("events").select("id, slug, name, status")
        .or(`name.ilike.${like},slug.ilike.${like}`).limit(6),
      sb.from("achievements").select("id, slug, name")
        .or(`name.ilike.${like},slug.ilike.${like}`).limit(6),
      sb.from("titles").select("id, slug, name")
        .or(`name.ilike.${like},slug.ilike.${like}`).limit(6),
    ]);
    return {
      players: (players.data ?? []) as any,
      quests: (quests.data ?? []) as any,
      collections: (collections.data ?? []) as any,
      events: (events.data ?? []) as any,
      achievements: (achievements.data ?? []) as any,
      titles: (titles.data ?? []) as any,
    };
  });

export type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_kind: string;
  target_id: string | null;
  summary: string | null;
  created_at: string;
};

export const listAuditEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number } | undefined) =>
    z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(d ?? {}))
  .handler(async ({ data, context }): Promise<AuditRow[]> => {
    await assertFounder(context);
    const { data: rows, error } = await context.supabase
      .from("audit_events")
      .select("id, actor_id, actor_email, action, target_kind, target_id, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return (rows ?? []) as AuditRow[];
  });