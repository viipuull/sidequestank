import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ReviewStatus = "pending_review" | "completed" | "failed" | "pending";

export const listPhotoReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        status: z.enum(["pending_review", "completed", "pending", "failed"]).default("pending_review"),
        limit: z.number().int().min(1).max(100).default(50),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const { data: isFounder } = await sb.rpc("has_role", {
      _user_id: context.userId,
      _role: "founder",
    });
    if (!isFounder) throw new Error("Forbidden");

    const { data: rows, error } = await sb
      .from("objective_progress")
      .select(
        `id, status, attempts, verification_data, verified_at, reviewed_at, review_notes, created_at, updated_at,
         user_id, objective_id, session_id,
         quest_objectives!inner(id, title, description, objective_type, quest_id, config,
           quests!inner(id, title, slug, cover_image_url, reward_xp)
         )`,
      )
      .eq("status", data.status as ReviewStatus)
      .eq("quest_objectives.objective_type", "take_photo")
      .order("updated_at", { ascending: false })
      .limit(data.limit);
    if (error) throw error;

    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const { data: players } = userIds.length
      ? await sb.from("profiles").select("id, username, display_name, avatar_url").in("id", userIds)
      : { data: [] as Array<{ id: string; username: string; display_name: string; avatar_url: string | null }> };
    const playerMap = new Map((players ?? []).map((p) => [p.id, p]));

    // Sign photo URLs
    const results = await Promise.all(
      (rows ?? []).map(async (row) => {
        const vd = (row.verification_data ?? {}) as { photoPath?: string };
        let photoUrl: string | null = null;
        if (vd.photoPath) {
          const { data: signed } = await sb.storage
            .from("quest-media")
            .createSignedUrl(vd.photoPath, 60 * 60);
          photoUrl = signed?.signedUrl ?? null;
        }
        const q = (row.quest_objectives as unknown as {
          id: string; title: string; description: string; quest_id: string;
          quests: { id: string; title: string; slug: string; cover_image_url: string | null; reward_xp: number };
        });
        return {
          id: row.id,
          status: row.status as ReviewStatus,
          attempts: row.attempts,
          submittedAt: row.updated_at,
          reviewedAt: row.reviewed_at,
          reviewNotes: row.review_notes ?? undefined,
          photoUrl,
          photoPath: vd.photoPath ?? null,
          player: playerMap.get(row.user_id) ?? { id: row.user_id, username: "unknown", display_name: "Unknown", avatar_url: null },
          objective: { id: q.id, title: q.title, description: q.description },
          quest: q.quests,
        };
      }),
    );
    return results;
  });

export const getPendingReviewCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: isFounder } = await sb.rpc("has_role", {
      _user_id: context.userId,
      _role: "founder",
    });
    if (!isFounder) return 0;
    const { count } = await sb
      .from("objective_progress")
      .select("id, quest_objectives!inner(objective_type)", { count: "exact", head: true })
      .eq("status", "pending_review")
      .eq("quest_objectives.objective_type", "take_photo");
    return count ?? 0;
  });

export const approvePhotoSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ progressId: z.string().uuid(), notes: z.string().max(1000).optional() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { data: result, error } = await context.supabase.rpc("founder_approve_photo", {
      _progress_id: data.progressId,
      _notes: data.notes ?? null,
    });
    if (error) throw error;
    return result;
  });

export const rejectPhotoSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ progressId: z.string().uuid(), reason: z.string().min(3).max(1000) }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { data: result, error } = await context.supabase.rpc("founder_reject_photo", {
      _progress_id: data.progressId,
      _reason: data.reason,
    });
    if (error) throw error;
    return result;
  });