import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
export type CollectionItemRow = Database["public"]["Tables"]["collection_items"]["Row"];
export type PlayerCollectionRow = Database["public"]["Tables"]["player_collections"]["Row"];

export type CollectionCard = CollectionRow & {
  quest_count: number;
  progress?: PlayerCollectionRow | null;
};

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

// ---- Public discovery: list published + counts ----
export const listPublicCollections = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublicClient();
  const { data, error } = await sb
    .from("collections")
    .select(sel("*, collection_items(id)"))
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("hidden", false)
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c) => {
    const items = (c as unknown as { collection_items: { id: string }[] }).collection_items ?? [];
    const { collection_items: _drop, ...rest } = c as unknown as Record<string, unknown> & {
      collection_items: unknown;
    };
    return { ...(rest as CollectionRow), quest_count: items.length };
  }) as CollectionCard[];
});

// ---- My collections (progress + defs), authenticated ----
export const myCollections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [defsRes, progRes] = await Promise.all([
      sb.from("collections")
        .select(sel("*, collection_items(id)"))
        .eq("status", "published"),
      sb.from("player_collections").select("*").eq("user_id", context.userId),
    ]);
    if (defsRes.error) throw defsRes.error;
    if (progRes.error) throw progRes.error;

    const progByCol = new Map(
      (progRes.data ?? []).map((p) => [p.collection_id, p as PlayerCollectionRow]),
    );
    return (defsRes.data ?? []).map((c) => {
      const items = (c as unknown as { collection_items: { id: string }[] }).collection_items ?? [];
      const { collection_items: _drop, ...rest } = c as unknown as Record<string, unknown> & {
        collection_items: unknown;
      };
      const base = rest as CollectionRow;
      return {
        ...base,
        quest_count: items.length,
        progress: progByCol.get(base.id) ?? null,
      } as CollectionCard;
    });
  });

// ---- Collection detail ----
export const getCollectionBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string().min(1) }).parse(raw))
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const { data: def, error } = await sb
      .from("collections")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    if (!def) return null;
    const { data: items } = await sb
      .from("collection_items")
      .select(sel("*, quests(id, slug, title, short_description, cover_image_url, difficulty, estimated_minutes, reward_xp, category)"))
      .eq("collection_id", def.id)
      .order("completion_order", { ascending: true });
    return { collection: def as CollectionRow, items: (items ?? []) as unknown as Array<
      CollectionItemRow & { quests: {
        id: string; slug: string; title: string; short_description: string;
        cover_image_url: string | null; difficulty: string; estimated_minutes: number;
        reward_xp: number; category: string;
      } | null }
    > };
  });

// ---- Detail with progress + user quest completion map ----
export const getMyCollectionDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ slug: z.string().min(1) }).parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const { data: def, error } = await sb
      .from("collections")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    if (!def) return null;

    const [itemsRes, progRes, sessRes] = await Promise.all([
      sb.from("collection_items")
        .select(sel("*, quests(id, slug, title, short_description, cover_image_url, difficulty, estimated_minutes, reward_xp, category)"))
        .eq("collection_id", def.id)
        .order("completion_order", { ascending: true }),
      sb.from("player_collections")
        .select("*")
        .eq("user_id", context.userId)
        .eq("collection_id", def.id)
        .maybeSingle(),
      sb.from("quest_sessions")
        .select("quest_id, status")
        .eq("user_id", context.userId),
    ]);
    const completedQuestIds = new Set(
      (sessRes.data ?? []).filter((s) => s.status === "completed").map((s) => s.quest_id),
    );
    return {
      collection: def as CollectionRow,
      items: (itemsRes.data ?? []) as unknown as Array<CollectionItemRow & { quests: {
        id: string; slug: string; title: string; short_description: string;
        cover_image_url: string | null; difficulty: string; estimated_minutes: number;
        reward_xp: number; category: string;
      } | null }>,
      progress: (progRes.data ?? null) as PlayerCollectionRow | null,
      completedQuestIds: Array.from(completedQuestIds),
    };
  });

// ---- Which collections contain this quest (public-safe) ----
export const getCollectionsForQuest = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ questId: z.string().uuid() }).parse(raw))
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const { data: rows } = await sb
      .from("collection_items")
      .select(sel("collection_id, collections(id, slug, name, icon, cover_image_url, status, visibility, hidden)"))
      .eq("quest_id", data.questId);
    return (rows ?? [])
      .map((r) => (r as unknown as { collections: {
        id: string; slug: string; name: string; icon: string;
        cover_image_url: string | null; status: string; visibility: string; hidden: boolean;
      } | null }).collections)
      .filter((c): c is NonNullable<typeof c> =>
        !!c && c.status === "published" && c.visibility === "public" && c.hidden === false,
      );
  });

// ---- Player: favorite / pin ----
export const toggleCollectionFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ collectionId: z.string().uuid(), favorite: z.boolean().optional() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const { data: existing } = await sb
      .from("player_collections")
      .select("id, favorite")
      .eq("user_id", context.userId)
      .eq("collection_id", data.collectionId)
      .maybeSingle();
    const next = data.favorite ?? !(existing?.favorite ?? false);
    if (existing) {
      await sb.from("player_collections").update({ favorite: next }).eq("id", existing.id);
    } else {
      await sb.from("player_collections").insert({
        user_id: context.userId,
        collection_id: data.collectionId,
        favorite: next,
      });
    }
    return { favorite: next };
  });

// ============================================================================
// FOUNDER STUDIO
// ============================================================================

async function assertFounder(sb: unknown, userId: string) {
  const client = sb as { rpc: (n: string, args: Record<string, string>) => Promise<{ data: boolean | null }> };
  const { data } = await client.rpc("has_role", { _user_id: userId, _role: "founder" });
  if (!data) throw new Error("Forbidden");
}

export const founderListCollections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context.supabase, context.userId);
    const sb = context.supabase;
    const { data, error } = await sb
      .from("collections")
      .select(sel("*, collection_items(id)"))
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((c) => {
      const items = (c as unknown as { collection_items: { id: string }[] }).collection_items ?? [];
      const { collection_items: _drop, ...rest } = c as unknown as Record<string, unknown> & {
        collection_items: unknown;
      };
      return { ...(rest as CollectionRow), quest_count: items.length };
    }) as CollectionCard[];
  });

const collectionInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(120),
  description: z.string().default(""),
  icon: z.string().default("📚"),
  cover_image_url: z.string().url().nullable().optional(),
  banner_image_url: z.string().url().nullable().optional(),
  category: z.string().default("adventure"),
  collection_type: z.string().default("quest_series"),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]).default("easy"),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  seasonal: z.boolean().default(false),
  hidden: z.boolean().default(false),
  repeatable: z.boolean().default(false),
  estimated_minutes: z.number().int().min(1).default(60),
  display_order: z.number().int().default(100),
  reward_xp: z.number().int().min(0).default(0),
  reward_title_id: z.string().uuid().nullable().optional(),
  reward_achievement_id: z.string().uuid().nullable().optional(),
  reward_badge_image_url: z.string().url().nullable().optional(),
  reward_summary: z.string().default(""),
  tags: z.array(z.string()).default([]),
  city: z.string().default("Ankleshwar"),
});

export const founderSaveCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => collectionInput.parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context.supabase, context.userId);
    const sb = context.supabase;
    const { id, ...rest } = data;
    const payload = { ...rest, created_by: context.userId };
    if (id) {
      const { data: row, error } = await sb.from("collections").update(payload).eq("id", id).select("*").single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await sb.from("collections").insert(payload).select("*").single();
    if (error) throw error;
    return row;
  });

export const founderArchiveCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid(), archive: z.boolean() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context.supabase, context.userId);
    await context.supabase
      .from("collections")
      .update({ status: data.archive ? "archived" : "draft" })
      .eq("id", data.id);
    return { ok: true };
  });

export const founderDuplicateCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context.supabase, context.userId);
    const sb = context.supabase;
    const { data: src, error } = await sb.from("collections").select("*").eq("id", data.id).single();
    if (error || !src) throw error ?? new Error("Not found");
    const copySlug = `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;
    const { id: _drop, created_at: _c, updated_at: _u, published_at: _p, ...rest } = src;
    const { data: created, error: e2 } = await sb
      .from("collections")
      .insert({ ...rest, slug: copySlug, name: `${src.name} (Copy)`, status: "draft", featured: false, created_by: context.userId })
      .select("*")
      .single();
    if (e2) throw e2;
    const { data: items } = await sb.from("collection_items").select("quest_id, completion_order, required, unlock_requirement").eq("collection_id", src.id);
    if (items && items.length > 0) {
      await sb.from("collection_items").insert(items.map((i) => ({ ...i, collection_id: created.id })));
    }
    return created;
  });

// ---- Collection ↔ Quest linking ----
export const founderSetCollectionItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      collectionId: z.string().uuid(),
      items: z.array(z.object({
        quest_id: z.string().uuid(),
        completion_order: z.number().int().default(0),
        required: z.boolean().default(true),
      })),
    }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    await assertFounder(context.supabase, context.userId);
    const sb = context.supabase;
    await sb.from("collection_items").delete().eq("collection_id", data.collectionId);
    if (data.items.length > 0) {
      const { error } = await sb.from("collection_items").insert(
        data.items.map((i, idx) => ({
          collection_id: data.collectionId,
          quest_id: i.quest_id,
          completion_order: i.completion_order || idx,
          required: i.required,
        })),
      );
      if (error) throw error;
    }
    return { ok: true, count: data.items.length };
  });

// ---- Founder helpers ----
export const founderListQuestsForPicker = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("quests")
      .select("id, slug, title, status, category, difficulty")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

export const founderListTitlesForPicker = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("titles")
      .select("id, name, icon, rarity")
      .eq("active", true)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const founderListAchievementsForPicker = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("achievements")
      .select("id, name, icon, rarity")
      .eq("active", true)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });