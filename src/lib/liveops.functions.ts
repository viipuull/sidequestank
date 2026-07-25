import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];

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

async function assertFounder(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "founder" });
  if (!data) throw new Error("Forbidden");
}

// ============ EVENTS ============
export type EventSummary = EventRow & {
  reward_count: number;
  quest_count: number;
  joined: boolean;
};

export const listEvents = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({
      status: z.enum(["live", "scheduled", "ended", "all"]).default("all"),
      limit: z.number().int().min(1).max(60).default(30),
    }).parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    let q = sb.from("events").select("*").eq("visibility", "public");
    if (data.status !== "all") q = q.eq("status", data.status);
    else q = q.in("status", ["live", "scheduled", "ended"]);
    q = q.order("featured", { ascending: false }).order("priority", { ascending: false }).order("starts_at", { ascending: false }).limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw error;
    return (rows ?? []) as EventRow[];
  });

export const getEventBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string().min(1) }).parse(raw))
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const { data: event } = await sb.from("events").select("*").eq("slug", data.slug).maybeSingle();
    if (!event) return null;
    const [{ data: rewards }, { data: quests }, { data: challenges }] = await Promise.all([
      sb.from("event_rewards").select("*").eq("event_id", event.id).order("display_order"),
      sb.from("event_quests").select("display_order, featured, quests(id, slug, title, cover_image_url, category, difficulty, reward_xp, city)").eq("event_id", event.id).order("display_order"),
      sb.from("event_challenges").select("challenges(*)").eq("event_id", event.id).order("display_order"),
    ]);
    return {
      event: event as EventRow,
      rewards: (rewards ?? []) as Database["public"]["Tables"]["event_rewards"]["Row"][],
      quests: (quests ?? []) as unknown as Array<{ featured: boolean; display_order: number; quests: { id: string; slug: string; title: string; cover_image_url: string | null; category: string; difficulty: string; reward_xp: number; city: string } }>,
      challenges: ((challenges ?? []) as unknown as Array<{ challenges: ChallengeRow }>).map((c) => c.challenges),
    };
  });

export const getMyEventProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ event_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase.from("player_events")
      .select("*").eq("user_id", context.userId).eq("event_id", data.event_id).maybeSingle();
    return row ?? null;
  });

export const joinEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ event_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { data: res, error } = await context.supabase.rpc("join_event", { _event_id: data.event_id });
    if (error) throw error;
    return res;
  });

export const tickLiveOps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context);
    const { data, error } = await context.supabase.rpc("tick_liveops");
    if (error) throw error;
    return data;
  });

// ============ CHALLENGES ============
export const listActiveChallenges = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = serverPublicClient();
    const { data } = await sb.from("challenges").select("*").eq("active", true).eq("visibility", "public")
      .order("reset_frequency").order("display_order");
    return (data ?? []) as ChallengeRow[];
  });

export const getMyChallenges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: challenges } = await context.supabase.from("challenges").select("*").eq("active", true).order("reset_frequency").order("display_order");
    const { data: progress } = await context.supabase.from("player_challenges").select("*").eq("user_id", context.userId);
    return {
      challenges: (challenges ?? []) as ChallengeRow[],
      progress: (progress ?? []) as Database["public"]["Tables"]["player_challenges"]["Row"][],
    };
  });

// ============ NOTIFICATIONS ============
export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ limit: z.number().int().min(1).max(100).default(50) }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    const { data: rows } = await context.supabase.from("notifications")
      .select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(data.limit);
    return (rows ?? []) as NotificationRow[];
  });

export const getUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await context.supabase.from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId).is("read_at", null);
    return { count: count ?? 0 };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id).eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId).is("read_at", null);
    if (error) throw error;
    return { ok: true };
  });

export const deleteNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("notifications")
      .delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ============ ANNOUNCEMENTS ============
export const listActiveAnnouncements = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = serverPublicClient();
    const nowIso = new Date().toISOString();
    const { data } = await sb.from("announcements")
      .select("*").eq("visibility", "public").lte("starts_at", nowIso)
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
      .order("priority", { ascending: false }).order("starts_at", { ascending: false }).limit(20);
    return (data ?? []) as AnnouncementRow[];
  });

// ============ FEATURED QUESTS ============
export const listFeaturedQuests = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = serverPublicClient();
    const nowIso = new Date().toISOString();
    const { data } = await sb.from("featured_quests")
      .select("id, priority, boost, note, quests(id, slug, title, cover_image_url, category, difficulty, reward_xp, city)")
      .lte("starts_at", nowIso).or(`ends_at.is.null,ends_at.gt.${nowIso}`)
      .order("priority", { ascending: false }).limit(10);
    return (data ?? []) as unknown as Array<{
      id: string; priority: number; boost: boolean; note: string | null;
      quests: { id: string; slug: string; title: string; cover_image_url: string | null; category: string; difficulty: string; reward_xp: number; city: string };
    }>;
  });

// ============ FOUNDER: management ============
const eventInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(80),
  name: z.string().min(2).max(120),
  description: z.string().max(2000).default(""),
  icon: z.string().max(10).default("🎉"),
  banner_url: z.string().url().nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
  event_type: z.enum(["daily_quest_set","weekly_challenge","monthly_challenge","seasonal","holiday","limited_time","founder","community","beta","sponsored"]),
  status: z.enum(["draft","scheduled","live","ended","archived"]).default("draft"),
  visibility: z.enum(["public","unlisted","private"]).default("public"),
  featured: z.boolean().default(false),
  priority: z.number().int().default(0),
  starts_at: z.string(),
  ends_at: z.string().nullable().optional(),
  community_goal: z.number().int().min(0).default(0),
  max_participants: z.number().int().min(0).nullable().optional(),
  repeatable: z.boolean().default(false),
});

export const founderUpsertEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => eventInput.parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const payload = { ...data, created_by: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("events").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("events").insert(payload).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const founderListAllEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context);
    const { data } = await context.supabase.from("events").select("*").order("created_at", { ascending: false });
    return (data ?? []) as EventRow[];
  });

export const founderDeleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { error } = await context.supabase.from("events").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const announcementInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(120),
  body: z.string().max(2000).default(""),
  icon: z.string().max(10).default("📣"),
  banner_url: z.string().url().nullable().optional(),
  priority: z.enum(["info","normal","high","critical"]).default("normal"),
  visibility: z.enum(["public","unlisted","private"]).default("public"),
  deep_link: z.string().max(500).nullable().optional(),
  starts_at: z.string(),
  ends_at: z.string().nullable().optional(),
});

export const founderUpsertAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => announcementInput.parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const payload = { ...data, created_by: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("announcements").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("announcements").insert(payload).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const founderListAllAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context);
    const { data } = await context.supabase.from("announcements").select("*").order("created_at", { ascending: false });
    return (data ?? []) as AnnouncementRow[];
  });

export const founderDeleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const challengeInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(80),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).default(""),
  icon: z.string().max(10).default("🎯"),
  metric: z.enum(["quests_completed","xp_earned","locations_visited","qr_scans","photos_submitted","collections_completed","achievements_unlocked","level_reached","trivia_correct"]),
  target: z.number().int().min(1),
  reset_frequency: z.enum(["none","daily","weekly","monthly"]).default("daily"),
  reward_xp: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  visibility: z.enum(["public","unlisted","private"]).default("public"),
  display_order: z.number().int().default(0),
});

export const founderUpsertChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => challengeInput.parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const payload = { ...data, created_by: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("challenges").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("challenges").insert(payload).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const founderListAllChallenges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context);
    const { data } = await context.supabase.from("challenges").select("*").order("display_order").order("created_at", { ascending: false });
    return (data ?? []) as ChallengeRow[];
  });

export const founderDeleteChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { error } = await context.supabase.from("challenges").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ FEATURED QUESTS mgmt ============
export const founderAddFeaturedQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    quest_id: z.string().uuid(), priority: z.number().int().default(0),
    boost: z.boolean().default(false), starts_at: z.string().optional(),
    ends_at: z.string().nullable().optional(), note: z.string().max(200).optional(),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { error } = await context.supabase.from("featured_quests").insert({
      ...data, starts_at: data.starts_at ?? new Date().toISOString(),
      created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const founderRemoveFeaturedQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { error } = await context.supabase.from("featured_quests").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ LIVEOPS METRICS ============
export const founderLiveOpsMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context);
    const [ev, ch, ann, notif] = await Promise.all([
      context.supabase.from("events").select("status"),
      context.supabase.from("challenges").select("active"),
      context.supabase.from("announcements").select("id"),
      context.supabase.from("notifications").select("id", { count: "exact", head: true }),
    ]);
    const events = (ev.data ?? []) as Array<{ status: string }>;
    const challenges = (ch.data ?? []) as Array<{ active: boolean }>;
    return {
      events_total: events.length,
      events_live: events.filter((e) => e.status === "live").length,
      events_scheduled: events.filter((e) => e.status === "scheduled").length,
      challenges_active: challenges.filter((c) => c.active).length,
      announcements_total: (ann.data ?? []).length,
      notifications_total: notif.count ?? 0,
    };
  });