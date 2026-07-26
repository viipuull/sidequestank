import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";
const BUCKET = "quest-media";
const SIGNED_EXPIRY_SECONDS = 315_360_000; // ~10 years

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

async function assertFounder(context: {
  supabase: ReturnType<typeof publicClient>;
  userId: string;
  claims: unknown;
}) {
  const email = (context.claims as { email?: string } | undefined)?.email?.toLowerCase();
  if (email === FOUNDER_EMAIL) return;
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "founder",
  });
  if (error || !data) throw new Error("Forbidden");
}

export type MediaAsset = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  url: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

// ---------- List ----------
export const founderListMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        search: z.string().max(120).optional(),
        type: z.enum(["all", "image", "video", "other"]).default("all"),
        limit: z.number().int().min(1).max(500).default(200),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    let q = context.supabase
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.search) q = q.ilike("filename", `%${data.search}%`);
    if (data.type === "image") q = q.like("mime_type", "image/%");
    else if (data.type === "video") q = q.like("mime_type", "video/%");
    else if (data.type === "other")
      q = q.not("mime_type", "like", "image/%").not("mime_type", "like", "video/%");
    const { data: rows, error } = await q;
    if (error) throw error;
    return (rows ?? []) as MediaAsset[];
  });

// ---------- Save metadata after client-side upload ----------
const saveSchema = z.object({
  storage_path: z.string().min(1).max(400),
  filename: z.string().min(1).max(200),
  mime_type: z.string().min(1).max(120),
  size_bytes: z.number().int().min(0),
  width: z.number().int().min(0).nullable().optional(),
  height: z.number().int().min(0).nullable().optional(),
});

export const founderSaveMediaMetadata = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => saveSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const sb = context.supabase;
    // Sign a long-lived URL for the uploaded object
    const { data: signed, error: sErr } = await sb.storage
      .from(BUCKET)
      .createSignedUrl(data.storage_path, SIGNED_EXPIRY_SECONDS);
    if (sErr || !signed) throw sErr ?? new Error("Failed to sign URL");
    const { data: row, error } = await sb
      .from("media_assets")
      .insert({
        storage_bucket: BUCKET,
        storage_path: data.storage_path,
        filename: data.filename,
        mime_type: data.mime_type,
        size_bytes: data.size_bytes,
        width: data.width ?? null,
        height: data.height ?? null,
        url: signed.signedUrl,
        uploaded_by: context.userId,
      })
      .select()
      .maybeSingle();
    if (error) throw error;
    return row as MediaAsset;
  });

// ---------- Usage report ----------
// Returns rows referencing this URL across content tables.
export const founderMediaUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ url: z.string().url() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const sb = context.supabase;
    const url = data.url;
    type Ref = { kind: string; id: string; label: string; field: string };
    const refs: Ref[] = [];
    // Quests
    const qQ = await sb.from("quests").select("id,title,slug,cover_image_url,gallery_urls").or(
      `cover_image_url.eq.${url}`,
    );
    (qQ.data ?? []).forEach((r) =>
      refs.push({ kind: "quest", id: r.id, label: r.title, field: "cover_image_url" }),
    );
    const qGal = await sb.from("quests").select("id,title,gallery_urls").contains("gallery_urls", [url]);
    (qGal.data ?? []).forEach((r) =>
      refs.push({ kind: "quest", id: r.id, label: r.title, field: "gallery_urls" }),
    );
    // Collections
    const cQ = await sb.from("collections").select("id,name,cover_image_url,banner_image_url").or(
      `cover_image_url.eq.${url},banner_image_url.eq.${url}`,
    );
    (cQ.data ?? []).forEach((r) =>
      refs.push({
        kind: "collection",
        id: r.id,
        label: r.name,
        field: r.cover_image_url === url ? "cover_image_url" : "banner_image_url",
      }),
    );
    // Achievements
    const aQ = await sb.from("achievements").select("id,name,badge_image_url").eq("badge_image_url", url);
    (aQ.data ?? []).forEach((r) =>
      refs.push({ kind: "achievement", id: r.id, label: r.name, field: "badge_image_url" }),
    );
    // Events
    const eQ = await sb.from("events").select("id,name,banner_url,cover_url").or(
      `banner_url.eq.${url},cover_url.eq.${url}`,
    );
    (eQ.data ?? []).forEach((r) =>
      refs.push({
        kind: "event",
        id: r.id,
        label: r.name,
        field: r.banner_url === url ? "banner_url" : "cover_url",
      }),
    );
    // Announcements
    const anQ = await sb.from("announcements").select("id,title,banner_url").eq("banner_url", url);
    (anQ.data ?? []).forEach((r) =>
      refs.push({ kind: "announcement", id: r.id, label: r.title, field: "banner_url" }),
    );
    return refs;
  });

// ---------- Delete ----------
export const founderDeleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), force: z.boolean().default(false) }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const sb = context.supabase;
    const { data: asset, error: aErr } = await sb
      .from("media_assets")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!asset) throw new Error("Not found");
    if (!data.force) {
      // reuse usage lookup logic inline
      const url = (asset as MediaAsset).url;
      const checks = await Promise.all([
        sb.from("quests").select("id", { count: "exact", head: true }).eq("cover_image_url", url),
        sb.from("collections").select("id", { count: "exact", head: true }).or(
          `cover_image_url.eq.${url},banner_image_url.eq.${url}`,
        ),
        sb.from("achievements").select("id", { count: "exact", head: true }).eq("badge_image_url", url),
        sb.from("events").select("id", { count: "exact", head: true }).or(
          `banner_url.eq.${url},cover_url.eq.${url}`,
        ),
      ]);
      const total = checks.reduce((a, c) => a + (c.count ?? 0), 0);
      if (total > 0) throw new Error(`REFERENCED:${total}`);
    }
    const { error: rmErr } = await sb.storage
      .from((asset as MediaAsset).storage_bucket)
      .remove([(asset as MediaAsset).storage_path]);
    if (rmErr) throw rmErr;
    const { error: dErr } = await sb.from("media_assets").delete().eq("id", data.id);
    if (dErr) throw dErr;
    return { ok: true };
  });

// ---------- Replace: swap file, keep same URL row ----------
export const founderReplaceMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        storage_path: z.string().min(1),
        filename: z.string().min(1),
        mime_type: z.string().min(1),
        size_bytes: z.number().int().min(0),
        width: z.number().int().min(0).nullable().optional(),
        height: z.number().int().min(0).nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    await assertFounder(context);
    const sb = context.supabase;
    const { data: prev } = await sb.from("media_assets").select("storage_path,storage_bucket").eq("id", data.id).maybeSingle();
    const { data: signed, error: sErr } = await sb.storage
      .from(BUCKET)
      .createSignedUrl(data.storage_path, SIGNED_EXPIRY_SECONDS);
    if (sErr || !signed) throw sErr ?? new Error("Failed to sign URL");
    const { data: row, error } = await sb
      .from("media_assets")
      .update({
        storage_path: data.storage_path,
        filename: data.filename,
        mime_type: data.mime_type,
        size_bytes: data.size_bytes,
        width: data.width ?? null,
        height: data.height ?? null,
        url: signed.signedUrl,
      })
      .eq("id", data.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    // Best-effort remove old file
    if (prev && prev.storage_path && prev.storage_path !== data.storage_path) {
      await sb.storage.from(prev.storage_bucket || BUCKET).remove([prev.storage_path]);
    }
    return row as MediaAsset;
  });