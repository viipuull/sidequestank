import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";
const PIONEER_TARGET = 25;

export type FounderUserRow = {
  id: string;
  display_name: string;
  username: string;
  email: string | null;
  created_at: string;
  is_pioneer: boolean;
};

export type FounderStats = {
  total: number;
  pioneers: number;
  pioneerTarget: number;
  today: number;
  thisWeek: number;
  recent: FounderUserRow[];
};

export const getFounderStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FounderStats> => {
    const email = (context.claims as { email?: string } | undefined)?.email;
    if (email?.toLowerCase() !== FOUNDER_EMAIL) {
      throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, is_pioneer, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Best-effort email lookup via auth admin API.
    const emailByUserId = new Map<string, string | null>();
    try {
      let page = 1;
      const perPage = 200;
      for (;;) {
        const { data, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
        if (listErr) break;
        for (const u of data.users) emailByUserId.set(u.id, u.email ?? null);
        if (data.users.length < perPage) break;
        page += 1;
        if (page > 25) break;
      }
    } catch {
      // ignore — emails become null in the response.
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    let today = 0;
    let thisWeek = 0;
    let pioneers = 0;
    for (const p of profiles ?? []) {
      const t = new Date(p.created_at).getTime();
      if (t >= startOfDay) today += 1;
      if (t >= weekAgo) thisWeek += 1;
      if (p.is_pioneer) pioneers += 1;
    }

    const recent: FounderUserRow[] = (profiles ?? []).slice(0, 50).map((p) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      email: emailByUserId.get(p.id) ?? null,
      created_at: p.created_at,
      is_pioneer: p.is_pioneer,
    }));

    return {
      total: profiles?.length ?? 0,
      pioneers,
      pioneerTarget: PIONEER_TARGET,
      today,
      thisWeek,
      recent,
    };
  });

/**
 * Sends the SideQuest welcome email after a new account is created.
 *
 * TODO(email-provider): wire this up to a real email provider (Resend,
 * Supabase Auth webhook, or Lovable email scaffolding). Right now the
 * server logs the payload so the frontend flow works end-to-end.
 */
export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { displayName: string }) => ({
    displayName: String(input?.displayName ?? "Explorer").slice(0, 60),
  }))
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string } | undefined)?.email ?? null;
    const subject = "🚀 Welcome to SideQuest!";
    const body = `Hi ${data.displayName},\n\nWelcome to SideQuest — where your city becomes the adventure.\n\nYour account has been successfully created.\n\nYou're now one of our earliest explorers helping shape SideQuest.\nYour account is ready.\n\nKeep an eye out for exciting updates, quests, and announcements.\n\nThanks for joining us from the beginning.\n\n— Team SideQuest`;

    // TODO(email-provider): replace this console log with a real send call.
    console.info("[welcome-email:pending-provider]", { to: email, subject, body });
    return { queued: true, to: email };
  });