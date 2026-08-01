import { sendToTokens } from "./push.server";

/**
 * Mirrors one in-app notification row to the player's push devices.
 * Called by the DB trigger via /api/public/hooks/push-notify.
 */
export async function pushNotificationToUser(notificationId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;

  const { data: n } = await admin
    .from("notifications")
    .select("id, user_id, kind, title, body, icon, deep_link, priority, metadata")
    .eq("id", notificationId)
    .maybeSingle();
  if (!n) return { ok: false, reason: "not_found" as const };

  const { data: rows } = await admin
    .from("push_tokens")
    .select("token")
    .eq("user_id", n.user_id)
    .is("invalid_at", null)
    .eq("enabled", true);
  const tokens: string[] = (rows ?? []).map((r: { token: string }) => r.token);
  if (tokens.length === 0) return { ok: true, sent: 0, reason: "no_devices" as const };

  const results = await sendToTokens(tokens, {
    title: n.icon ? `${n.icon} ${stripLeadingEmoji(n.title)}` : n.title,
    body: n.body ?? "",
    deep_link: n.deep_link || "/home",
    kind: String(n.kind),
  });

  const dead = results.filter((r) => r.invalid).map((r) => r.token);
  if (dead.length) await admin.from("push_tokens").delete().in("token", dead);

  return { ok: true, sent: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length };
}

/** Avoids "🔔 🔔 Title" when the title already starts with the icon. */
function stripLeadingEmoji(title: string) {
  return title.replace(/^\s*[\p{Extended_Pictographic}\uFE0F]+\s*/u, "").trim() || title;
}