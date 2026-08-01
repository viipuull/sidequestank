import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertFounder(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "founder",
  });
  if (!data) throw new Error("Forbidden");
}

// ---------------- player tokens ----------------

export const savePushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        token: z.string().min(20).max(4096),
        user_agent: z.string().max(300).optional().nullable(),
        replaces: z.string().max(4096).optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    if (data.replaces) {
      await sb.from("push_tokens").delete().eq("token", data.replaces).eq("user_id", context.userId);
    }
    const { error } = await sb.from("push_tokens").upsert(
      {
        user_id: context.userId,
        token: data.token,
        platform: "web",
        user_agent: data.user_agent ?? null,
        enabled: true,
        invalid_at: null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeMyPushTokens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const { error } = await sb.from("push_tokens").delete().eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const myPushDevices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const { data } = await sb
      .from("push_tokens")
      .select("id, user_agent, last_seen_at, created_at")
      .eq("user_id", context.userId)
      .is("invalid_at", null)
      .order("last_seen_at", { ascending: false });
    return (data ?? []) as { id: string; user_agent: string | null; last_seen_at: string; created_at: string }[];
  });

// ---------------- founder: campaigns ----------------

const campaignSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  title: z.string().min(2).max(120),
  body: z.string().min(2).max(500),
  image_url: z.string().max(600).optional().nullable(),
  deep_link: z.string().min(1).max(300).default("/home"),
  action_label: z.string().max(40).optional().nullable(),
  action_url: z.string().max(300).optional().nullable(),
  kind: z.enum([
    "new_quest_nearby", "quest_reminder", "event_reminder", "achievement_unlocked",
    "level_up", "collection_completed", "founder_announcement", "daily_reminder", "weekly_summary",
  ]),
  audience_kind: z.enum(["everyone", "player", "level", "title", "city", "event"]),
  audience: z.record(z.string(), z.any()).default({}),
  status: z.enum(["draft", "scheduled"]).default("draft"),
  scheduled_at: z.string().optional().nullable(),
  also_inbox: z.boolean().default(true),
});

export const founderUpsertCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => campaignSchema.parse(raw))
  .handler(async ({ data, context }) => {
    await assertFounder(context);
    const sb = context.supabase as any;
    const row = {
      ...data,
      id: data.id ?? undefined,
      scheduled_at: data.status === "scheduled" ? data.scheduled_at : null,
      created_by: context.userId,
    };
    const { data: saved, error } = await sb.from("push_campaigns").upsert(row).select("id").single();
    if (error) throw new Error(error.message);
    return saved as { id: string };
  });

export const founderListCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context);
    const sb = context.supabase as any;
    const { data, error } = await sb
      .from("push_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const founderDeleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertFounder(context);
    const sb = context.supabase as any;
    const { error } = await sb.from("push_campaigns").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const founderCampaignDeliveries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertFounder(context);
    const sb = context.supabase as any;
    const { data: rows } = await sb
      .from("push_deliveries")
      .select("id, user_id, token_tail, success, error, created_at")
      .eq("campaign_id", data.id)
      .order("created_at", { ascending: false })
      .limit(200);
    return (rows ?? []) as any[];
  });

export const founderSendCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertFounder(context);
    const { runCampaign } = await import("@/lib/push-dispatch.server");
    return await runCampaign(data.id);
  });

/** Dropdown data for the audience picker. */
export const founderPushOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context);
    const sb = context.supabase as any;
    const [titles, events, players] = await Promise.all([
      sb.from("titles").select("id, name").order("display_order").limit(200),
      sb.from("events").select("id, name").order("starts_at", { ascending: false }).limit(100),
      sb.from("profiles").select("id, username, display_name, city, level").order("created_at", { ascending: false }).limit(500),
    ]);
    const cities = Array.from(
      new Set(((players.data ?? []) as any[]).map((p) => p.city).filter(Boolean)),
    ).sort();
    return {
      titles: (titles.data ?? []) as { id: string; name: string }[],
      events: (events.data ?? []) as { id: string; name: string }[],
      players: (players.data ?? []) as { id: string; username: string; display_name: string; level: number }[],
      cities: cities as string[],
    };
  });