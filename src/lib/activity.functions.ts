import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const sel = (s: string): string => s;

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

export type FeedItem = {
  id: string;
  user_id: string;
  kind: Database["public"]["Enums"]["activity_kind"];
  ref_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  profile: { username: string; display_name: string; avatar_url: string | null; city: string } | null;
};

const feedInput = z.object({
  limit: z.number().int().min(1).max(50).default(30),
  offset: z.number().int().min(0).max(2000).default(0),
  kind: z.enum(["quest_completed","level_up","title_unlocked","achievement_unlocked","collection_completed"]).optional(),
});

export const getGlobalActivity = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => feedInput.parse(raw ?? {}))
  .handler(async ({ data }): Promise<FeedItem[]> => {
    const sb = serverPublicClient();
    let q = sb.from("activity_events")
      .select(sel("id, user_id, kind, ref_id, payload, created_at, profiles(username, display_name, avatar_url, city)"))
      .eq("visibility", "public")
      .order("created_at", { ascending: false });
    if (data.kind) q = q.eq("kind", data.kind);
    q = q.range(data.offset, data.offset + data.limit - 1);
    const { data: rows, error } = await q;
    if (error) throw error;
    return (rows ?? []).map((r) => {
      const row = r as unknown as FeedItem & { profiles: FeedItem["profile"] };
      return { ...row, profile: row.profiles } as FeedItem;
    });
  });
