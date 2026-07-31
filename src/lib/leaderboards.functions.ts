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

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  xp: number;
  level: number;
  quests_completed: number;
  collections_completed: number;
  achievements_earned: number;
  titles_earned: number;
  profile: { username: string; display_name: string; avatar_url: string | null; city: string; is_pioneer: boolean; pioneer_number: number | null };
  equipped_title: { name: string; color: string; icon: string; rarity: string } | null;
};

const scopeE = z.enum(["global","country","state","city","event","friends","team"]);
const periodE = z.enum(["all_time","weekly","monthly","seasonal"]);

/** Rebuild the requested board when it is missing or stale. Safe/no-op when fresh. */
async function ensureFresh(
  sb: ReturnType<typeof serverPublicClient>,
  args: { scope: string; scope_key: string; period: string; period_key: string },
): Promise<void> {
  try {
    await sb.rpc("ensure_leaderboard", {
      _scope: args.scope,
      _scope_key: args.scope_key,
      _period: args.period,
      _period_key: args.period_key,
      _max_age_seconds: 120,
    } as never);
  } catch {
    // never block a read on a refresh failure
  }
}

const listInput = z.object({
  scope: scopeE.default("global"),
  scope_key: z.string().max(60).default(""),
  period: periodE.default("all_time"),
  period_key: z.string().max(20).default("all"),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).max(10000).default(0),
  query: z.string().max(60).optional(),
});

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => listInput.parse(raw ?? {}))
  .handler(async ({ data }): Promise<LeaderboardEntry[]> => {
    const sb = serverPublicClient();
    await ensureFresh(sb, { scope: data.scope, scope_key: data.scope_key, period: data.period, period_key: data.period_key });
    let q = sb.from("leaderboard_snapshots")
      .select(sel("rank, user_id, xp, level, quests_completed, collections_completed, achievements_earned, titles_earned"))
      .eq("scope", data.scope).eq("scope_key", data.scope_key)
      .eq("period", data.period).eq("period_key", data.period_key)
      .order("rank", { ascending: true });
    q = q.range(data.offset, data.offset + data.limit - 1);
    const { data: rows, error } = await q;
    if (error) throw error;
    const baseRows = (rows ?? []) as unknown as Array<{
      rank: number; user_id: string; xp: number; level: number;
      quests_completed: number; collections_completed: number;
      achievements_earned: number; titles_earned: number;
    }>;
    const ids = baseRows.map((r) => r.user_id);
    const pmap = new Map<string, LeaderboardEntry["profile"]>();
    if (ids.length) {
      const { data: profs } = await sb.from("profiles")
        .select(sel("id, username, display_name, avatar_url, city, is_pioneer, pioneer_number"))
        .in("id", ids);
      for (const p of (profs ?? []) as unknown as Array<{ id: string } & LeaderboardEntry["profile"]>) {
        pmap.set(p.id, { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url, city: p.city, is_pioneer: p.is_pioneer, pioneer_number: p.pioneer_number });
      }
    }
    const tmap = new Map<string, LeaderboardEntry["equipped_title"]>();
    if (ids.length) {
      const { data: t } = await sb.from("player_titles")
        .select(sel("user_id, titles(name, color, icon, rarity)"))
        .in("user_id", ids).eq("equipped", true);
      for (const r of (t ?? []) as unknown as Array<{ user_id: string; titles: LeaderboardEntry["equipped_title"] }>) {
        tmap.set(r.user_id, r.titles);
      }
    }
    const fallback: LeaderboardEntry["profile"] = { username: "explorer", display_name: "Explorer", avatar_url: null, city: "", is_pioneer: false, pioneer_number: null };
    const query = data.query?.trim().toLowerCase();
    const mapped = baseRows.map((row) => ({
      rank: row.rank, user_id: row.user_id, xp: row.xp, level: row.level,
      quests_completed: row.quests_completed, collections_completed: row.collections_completed,
      achievements_earned: row.achievements_earned, titles_earned: row.titles_earned,
      profile: pmap.get(row.user_id) ?? fallback,
      equipped_title: tmap.get(row.user_id) ?? null,
    }));
    return query
      ? mapped.filter((r) => r.profile.username.toLowerCase().includes(query) || r.profile.display_name.toLowerCase().includes(query))
      : mapped;
  });

const myRankInput = z.object({
  user_id: z.string().uuid(),
  scope: scopeE.default("global"),
  scope_key: z.string().max(60).default(""),
  period: periodE.default("all_time"),
  period_key: z.string().max(20).default("all"),
});

export const getMyRank = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => myRankInput.parse(raw))
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    await ensureFresh(sb, { scope: data.scope, scope_key: data.scope_key, period: data.period, period_key: data.period_key });
    const { data: row } = await sb.from("leaderboard_snapshots")
      .select("rank, xp, level")
      .eq("scope", data.scope).eq("scope_key", data.scope_key)
      .eq("period", data.period).eq("period_key", data.period_key)
      .eq("user_id", data.user_id).maybeSingle();
    return row ?? null;
  });
