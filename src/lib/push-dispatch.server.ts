import { sendToTokens, type PushPayload } from "./push.server";
import { interpolate } from "./push/variables";

/** Builds the smart-variable bag for one player. */
async function variableBag(admin: any, userId: string) {
  const [{ data: p }, { data: prog }, { data: rank }] = await Promise.all([
    admin.from("profiles").select("display_name, username, city, level, xp").eq("id", userId).maybeSingle(),
    admin.from("player_progress").select("current_level, lifetime_xp, xp_for_next_level, current_level_xp").eq("user_id", userId).maybeSingle(),
    admin.from("leaderboard_snapshots").select("rank").eq("user_id", userId).eq("scope", "global").eq("period", "all_time").maybeSingle(),
  ]);
  return {
    player_name: p?.display_name ?? p?.username ?? "Explorer",
    username: p?.username ?? "explorer",
    city: p?.city ?? "Ankleshwar",
    level: prog?.current_level ?? p?.level ?? 1,
    xp: prog?.lifetime_xp ?? p?.xp ?? 0,
    xp_remaining: Math.max(0, (prog?.xp_for_next_level ?? 0) - (prog?.current_level_xp ?? 0)),
    rank: rank?.rank ?? "—",
  } as Record<string, string | number>;
}

const hasVars = (s: string | null | undefined) => !!s && /\{\{\s*[a-z_]+\s*\}\}/i.test(s);

/**
 * Resolves a campaign's audience, sends to every live token, records delivery
 * rows, prunes invalid tokens and mirrors the message into the in-app inbox.
 * Runs with the service role — callers MUST authorize first.
 */
export async function runCampaign(campaignId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;

  const { data: campaign, error } = await admin
    .from("push_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();
  if (error || !campaign) throw new Error(error?.message ?? "Campaign not found");
  if (campaign.status === "sending" || campaign.status === "sent") {
    return { ok: true, skipped: true as const, recipients: campaign.recipients_count };
  }

  await admin.from("push_campaigns").update({ status: "sending" }).eq("id", campaignId);

  try {
    const { data: audience, error: audErr } = await admin.rpc("resolve_push_audience", {
      _kind: campaign.audience_kind,
      _audience: campaign.audience ?? {},
    });
    if (audErr) throw new Error(audErr.message);
    const userIds: string[] = (audience ?? []).map((r: { user_id: string }) => r.user_id);

    if (campaign.also_inbox) {
      for (const uid of userIds) {
        const bag = hasVars(campaign.title) || hasVars(campaign.body) ? await variableBag(admin, uid) : {};
        await admin.rpc("notify_user", {
          _user_id: uid,
          _kind: "announcement",
          _title: interpolate(campaign.title, bag),
          _body: interpolate(campaign.body, bag),
          _icon: "🔔",
          _deep_link: campaign.deep_link,
          _priority: 20,
          _metadata: { campaign_id: campaignId, push_kind: campaign.kind },
        });
      }
    }

    let tokens: { token: string; user_id: string }[] = [];
    if (userIds.length > 0) {
      const { data: rows } = await admin
        .from("push_tokens")
        .select("token, user_id")
        .in("user_id", userIds)
        .is("invalid_at", null)
        .eq("enabled", true);
      tokens = rows ?? [];
    }

    const payload: PushPayload = {
      title: campaign.title,
      body: campaign.body,
      image: campaign.image_url,
      deep_link: campaign.deep_link || "/home",
      action_label: campaign.action_label,
      action_url: campaign.action_url,
      kind: campaign.kind,
      campaign_id: campaignId,
    };

    const personalize = hasVars(campaign.title) || hasVars(campaign.body);
    let results: Awaited<ReturnType<typeof sendToTokens>> = [];
    if (tokens.length && personalize) {
      // Smart variables need per-player copy, so send grouped by user.
      const byUser = new Map<string, string[]>();
      for (const t of tokens) byUser.set(t.user_id, [...(byUser.get(t.user_id) ?? []), t.token]);
      for (const [uid, list] of byUser) {
        const bag = await variableBag(admin, uid);
        const personal = {
          ...payload,
          title: interpolate(campaign.title, bag),
          body: interpolate(campaign.body, bag),
        };
        results = results.concat(await sendToTokens(list, personal));
      }
    } else if (tokens.length) {
      results = await sendToTokens(tokens.map((t) => t.token), payload);
    }
    const byToken = new Map(tokens.map((t) => [t.token, t.user_id]));

    if (results.length) {
      await admin.from("push_deliveries").insert(
        results.map((r) => ({
          campaign_id: campaignId,
          user_id: byToken.get(r.token) ?? null,
          token_tail: r.token.slice(-10),
          success: r.success,
          error: r.error ?? null,
        })),
      );
      const dead = results.filter((r) => r.invalid).map((r) => r.token);
      if (dead.length) {
        await admin.from("push_tokens").delete().in("token", dead);
      }
    }

    const success = results.filter((r) => r.success).length;
    await admin
      .from("push_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipients_count: userIds.length,
        success_count: success,
        failure_count: results.length - success,
        error: null,
      })
      .eq("id", campaignId);

    return { ok: true, recipients: userIds.length, sent: success, failed: results.length - success };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed";
    await admin.from("push_campaigns").update({ status: "failed", error: message }).eq("id", campaignId);
    throw e;
  }
}

/** Picks up scheduled campaigns whose time has come. */
export async function runDueCampaigns() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const { data } = await admin
    .from("push_campaigns")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .limit(20);
  const ids: string[] = (data ?? []).map((r: { id: string }) => r.id);
  const out: { id: string; ok: boolean; error?: string }[] = [];
  for (const id of ids) {
    try {
      await runCampaign(id);
      out.push({ id, ok: true });
    } catch (e) {
      out.push({ id, ok: false, error: e instanceof Error ? e.message : "failed" });
    }
  }
  return out;
}