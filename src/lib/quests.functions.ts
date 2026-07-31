import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { slugify } from "@/lib/quests.types";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";

// Keys inside quest_objectives.config that contain verification secrets
// (trivia answers, exact QR codes, target coordinates, tolerances, etc.).
// These must never be returned to players — verification runs server-side.
const SECRET_CONFIG_KEYS = new Set([
  "code", "answer", "correct", "correct_index", "correct_answer", "correct_option",
  "latitude", "longitude", "lat", "lng", "radius_m", "min_accuracy_m",
  "target", "solution",
]);

function redactObjectiveConfig<T extends { config?: unknown }>(obj: T): T {
  const cfg = (obj.config ?? {}) as Record<string, unknown>;
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cfg)) {
    if (!SECRET_CONFIG_KEYS.has(k)) safe[k] = v;
  }
  return { ...obj, config: safe };
}

// ---------- Public read client (anon) ----------
function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
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

async function assertFounder(context: { supabase: ReturnType<typeof publicClient>; userId: string; claims: unknown }) {
  const email = (context.claims as { email?: string } | undefined)?.email?.toLowerCase();
  if (email === FOUNDER_EMAIL) return;
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "founder",
  });
  if (error || !data) throw new Error("Forbidden");
}

// ---------- Player: list published quests ----------
export const listPublishedQuests = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        search: z.string().max(120).optional(),
        category: z.string().max(40).optional(),
        difficulty: z.string().max(20).optional(),
        questType: z.string().max(40).optional(),
        sort: z.enum(["newest", "featured", "quickest"]).default("newest"),
        limit: z.number().int().min(1).max(50).default(30),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb
      .from("quests")
      .select(
        "id, title, slug, short_description, cover_image_url, category, difficulty, quest_type, estimated_minutes, city, reward_preview, reward_xp, tags, featured, created_at, published_at",
      )
      .eq("status", "published")
      .eq("visibility", "public")
      .limit(data.limit);

    if (data.search) q = q.ilike("title", `%${data.search}%`);
    if (data.category) q = q.eq("category", data.category as never);
    if (data.difficulty) q = q.eq("difficulty", data.difficulty as never);
    if (data.questType) q = q.eq("quest_type", data.questType as never);

    if (data.sort === "featured") q = q.order("featured", { ascending: false }).order("created_at", { ascending: false });
    else if (data.sort === "quickest") q = q.order("estimated_minutes", { ascending: true });
    else q = q.order("created_at", { ascending: false });

    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// ---------- Player: quest details ----------
export const getPublishedQuestBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(raw))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: quest, error } = await sb
      .from("quests")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .eq("visibility", "public")
      .maybeSingle();
    if (error) throw error;
    if (!quest) return null;
    const { data: objectives, error: oErr } = await sb
      .from("quest_objectives")
      .select("*")
      .eq("quest_id", quest.id)
      .order("completion_order", { ascending: true });
    if (oErr) throw oErr;
    return { ...quest, objectives: (objectives ?? []).map(redactObjectiveConfig) };
  });

// ---------- Founder: list all quests (any status) ----------
export const listAllQuests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        search: z.string().max(120).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    let q = context.supabase
      .from("quests")
      .select("id, title, slug, status, visibility, category, difficulty, quest_type, featured, updated_at, created_at, published_at")
      .order("updated_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// ---------- Founder: get quest for editing ----------
export const getQuestForEdit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { data: quest, error } = await context.supabase
      .from("quests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!quest) return null;
    const { data: objectives, error: oErr } = await context.supabase
      .from("quest_objectives")
      .select("*")
      .eq("quest_id", quest.id)
      .order("completion_order", { ascending: true });
    if (oErr) throw oErr;
    return { ...quest, objectives: objectives ?? [] };
  });

// ---------- Shared quest input schema ----------
const objectiveSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(160),
  description: z.string().max(2000).default(""),
  objective_type: z.enum([
    "visit_location", "gps_checkin", "scan_qr", "take_photo", "answer_trivia", "collect_item", "custom",
  ]),
  completion_order: z.number().int().min(0).default(0),
  required: z.boolean().default(true),
  config: z.record(z.string(), z.any()).default({}),
});

const questPayloadSchema = z.object({
  title: z.string().min(3).max(160),
  slug: z.string().max(120).optional().or(z.literal("")),
  short_description: z.string().max(240).default(""),
  full_description: z.string().max(8000).default(""),
  cover_image_url: z.string().url().max(1000).nullable().optional(),
  gallery_urls: z.array(z.string().url().max(1000)).max(12).default([]),
  category: z.enum(["exploration","food","culture","nature","history","photography","trivia","fitness","nightlife","community"]),
  quest_type: z.enum(["walking","photo","trivia","treasure_hunt","gps_checkin","qr_hunt","event","limited_time"]),
  difficulty: z.enum(["easy","medium","hard","expert"]),
  estimated_minutes: z.number().int().min(1).max(1440),
  address: z.string().max(240).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  city: z.string().min(1).max(80),
  reward_preview: z.string().max(240).default(""),
  reward_xp: z.number().int().min(0).max(100000).default(0),
  tags: z.array(z.string().max(24)).max(12).default([]),
  visibility: z.enum(["public","unlisted","private"]).default("public"),
  featured: z.boolean().default(false),
  repeatable: z.boolean().default(false),
  objectives: z.array(objectiveSchema).max(30).default([]),
});

// ---------- Founder: create quest ----------
export const createQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => questPayloadSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const baseSlug = (data.slug && data.slug.length > 0 ? data.slug : slugify(data.title)) || `quest-${Date.now()}`;
    const slug = await ensureUniqueSlug(context.supabase, baseSlug);

    const { data: quest, error } = await context.supabase
      .from("quests")
      .insert({
        title: data.title,
        slug,
        short_description: data.short_description,
        full_description: data.full_description,
        cover_image_url: data.cover_image_url ?? null,
        gallery_urls: data.gallery_urls,
        category: data.category,
        quest_type: data.quest_type,
        difficulty: data.difficulty,
        estimated_minutes: data.estimated_minutes,
        address: data.address ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        city: data.city,
        reward_preview: data.reward_preview,
        reward_xp: data.reward_xp,
        tags: data.tags,
        visibility: data.visibility,
        featured: data.featured,
        repeatable: data.repeatable,
        status: "draft",
        created_by: context.userId,
      })
      .select("id, slug")
      .single();
    if (error) throw error;

    if (data.objectives.length > 0) {
      const { error: oErr } = await context.supabase.from("quest_objectives").insert(
        data.objectives.map((o, i) => ({
          quest_id: quest.id,
          title: o.title,
          description: o.description,
          objective_type: o.objective_type,
          completion_order: o.completion_order ?? i,
          required: o.required,
          config: o.config ?? {},
        })),
      );
      if (oErr) throw oErr;
    }
    return quest;
  });

// ---------- Founder: update quest ----------
export const updateQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), payload: questPayloadSchema }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const p = data.payload;

    // Keep slug if unchanged, else regenerate uniqueness
    let slug = p.slug && p.slug.length > 0 ? p.slug : slugify(p.title);
    const { data: existing } = await context.supabase
      .from("quests").select("slug").eq("id", data.id).maybeSingle();
    if (existing && existing.slug !== slug) {
      slug = await ensureUniqueSlug(context.supabase, slug, data.id);
    } else if (existing) {
      slug = existing.slug;
    }

    const { error } = await context.supabase
      .from("quests")
      .update({
        title: p.title,
        slug,
        short_description: p.short_description,
        full_description: p.full_description,
        cover_image_url: p.cover_image_url ?? null,
        gallery_urls: p.gallery_urls,
        category: p.category,
        quest_type: p.quest_type,
        difficulty: p.difficulty,
        estimated_minutes: p.estimated_minutes,
        address: p.address ?? null,
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
        city: p.city,
        reward_preview: p.reward_preview,
        reward_xp: p.reward_xp,
        tags: p.tags,
        visibility: p.visibility,
        featured: p.featured,
        repeatable: p.repeatable,
      })
      .eq("id", data.id);
    if (error) throw error;

    // Replace objectives set
    const { error: dErr } = await context.supabase
      .from("quest_objectives").delete().eq("quest_id", data.id);
    if (dErr) throw dErr;
    if (p.objectives.length > 0) {
      const { error: iErr } = await context.supabase.from("quest_objectives").insert(
        p.objectives.map((o, i) => ({
          quest_id: data.id,
          title: o.title,
          description: o.description,
          objective_type: o.objective_type,
          completion_order: o.completion_order ?? i,
          required: o.required,
          config: o.config ?? {},
        })),
      );
      if (iErr) throw iErr;
    }
    return { id: data.id, slug };
  });

// ---------- Founder: status transitions ----------
export const setQuestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["draft", "published", "archived"]),
    }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { error } = await context.supabase
      .from("quests").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { error } = await context.supabase.from("quests").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const duplicateQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const { data: src, error } = await context.supabase
      .from("quests").select("*").eq("id", data.id).maybeSingle();
    if (error) throw error;
    if (!src) throw new Error("Not found");

    const baseSlug = await ensureUniqueSlug(context.supabase, `${src.slug}-copy`);
    const { data: copy, error: cErr } = await context.supabase.from("quests").insert({
      title: `${src.title} (Copy)`,
      slug: baseSlug,
      short_description: src.short_description,
      full_description: src.full_description,
      cover_image_url: src.cover_image_url,
      gallery_urls: src.gallery_urls,
      category: src.category,
      quest_type: src.quest_type,
      difficulty: src.difficulty,
      estimated_minutes: src.estimated_minutes,
      address: src.address,
      latitude: src.latitude,
      longitude: src.longitude,
      city: src.city,
      reward_preview: src.reward_preview,
      reward_xp: src.reward_xp,
      tags: src.tags,
      visibility: src.visibility,
      featured: false,
      repeatable: false,
      status: "draft",
      created_by: context.userId,
    }).select("id").single();
    if (cErr) throw cErr;

    const { data: objs } = await context.supabase
      .from("quest_objectives").select("*").eq("quest_id", src.id);
    if (objs && objs.length > 0) {
      await context.supabase.from("quest_objectives").insert(
        objs.map((o) => ({
          quest_id: copy.id,
          title: o.title,
          description: o.description,
          objective_type: o.objective_type,
          completion_order: o.completion_order,
          required: o.required,
          config: o.config,
        })),
      );
    }
    return { id: copy.id };
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureUniqueSlug(sb: any, base: string, excludeId?: string): Promise<string> {
  let candidate = base || `quest-${Date.now()}`;
  let i = 1;
  // Try up to 30 times
  for (; i < 30; i += 1) {
    const { data } = await sb.from("quests").select("id").eq("slug", candidate).maybeSingle();
    if (!data || data.id === excludeId) return candidate;
    candidate = `${base}-${i + 1}`;
  }
  return `${base}-${Date.now()}`;
}