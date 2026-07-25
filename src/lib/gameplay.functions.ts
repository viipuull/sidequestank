import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---- helpers ----
function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// ---- Start or resume a session ----
export const startOrResumeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ questId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    // ensure quest exists and is playable (published+public OR founder-only preview allowed via existing RLS)
    const { data: quest, error: qErr } = await sb
      .from("quests")
      .select("id, slug, status, visibility")
      .eq("id", data.questId)
      .maybeSingle();
    if (qErr) throw qErr;
    if (!quest) throw new Error("Quest not found");

    // Resume any active/paused session
    const { data: existing } = await sb
      .from("quest_sessions")
      .select("id")
      .eq("quest_id", data.questId)
      .eq("user_id", context.userId)
      .in("status", ["active", "paused"])
      .maybeSingle();

    if (existing) {
      await sb
        .from("quest_sessions")
        .update({ status: "active", last_activity_at: new Date().toISOString() })
        .eq("id", existing.id);
      return { sessionId: existing.id, resumed: true };
    }

    const { data: created, error: cErr } = await sb
      .from("quest_sessions")
      .insert({ quest_id: data.questId, user_id: context.userId, status: "active" })
      .select("id")
      .single();
    if (cErr) throw cErr;
    return { sessionId: created.id, resumed: false };
  });

// ---- Get session with progress ----
export const getSessionState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ sessionId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const { data: session, error } = await sb
      .from("quest_sessions")
      .select("*")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (error) throw error;
    if (!session) throw new Error("Session not found");

    const { data: quest, error: qErr } = await sb
      .from("quests")
      .select("id, title, slug, short_description, cover_image_url, reward_xp, city, estimated_minutes, category")
      .eq("id", session.quest_id)
      .maybeSingle();
    if (qErr) throw qErr;

    const { data: objectives, error: oErr } = await sb
      .from("quest_objectives")
      .select("*")
      .eq("quest_id", session.quest_id)
      .order("completion_order", { ascending: true });
    if (oErr) throw oErr;

    const { data: progress, error: pErr } = await sb
      .from("objective_progress")
      .select("*")
      .eq("session_id", session.id);
    if (pErr) throw pErr;

    return { session, quest, objectives: objectives ?? [], progress: progress ?? [] };
  });

// ---- Get active session for a quest (for resume UI) ----
export const getActiveSessionForQuest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ questId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { data: session } = await context.supabase
      .from("quest_sessions")
      .select("id, status, started_at, last_activity_at, completed_at")
      .eq("quest_id", data.questId)
      .eq("user_id", context.userId)
      .order("last_activity_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return session ?? null;
  });

// ---- Submit / verify an objective ----
const submitSchema = z.object({
  sessionId: z.string().uuid(),
  objectiveId: z.string().uuid(),
  payload: z
    .object({
      // GPS
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      accuracy: z.number().min(0).max(10000).optional(),
      // QR
      code: z.string().max(500).optional(),
      // Trivia
      choiceIndex: z.number().int().min(0).max(20).optional(),
      // Photo
      photoPath: z.string().max(500).optional(),
      // Manual note
      note: z.string().max(1000).optional(),
    })
    .default({}),
});

export const submitObjective = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => submitSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase;

    // Load session + objective
    const { data: session, error: sErr } = await sb
      .from("quest_sessions")
      .select("id, quest_id, user_id, status")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!session) throw new Error("Session not found");
    if (session.user_id !== context.userId) throw new Error("Forbidden");
    if (session.status === "completed" || session.status === "abandoned") {
      throw new Error("Session already finished");
    }

    const { data: obj, error: oErr } = await sb
      .from("quest_objectives")
      .select("*")
      .eq("id", data.objectiveId)
      .maybeSingle();
    if (oErr) throw oErr;
    if (!obj || obj.quest_id !== session.quest_id) throw new Error("Objective not in quest");

    // Prevent duplicate completion
    const { data: existingProgress } = await sb
      .from("objective_progress")
      .select("id, status, attempts")
      .eq("session_id", session.id)
      .eq("objective_id", obj.id)
      .maybeSingle();
    if (existingProgress?.status === "completed") {
      return { ok: true, alreadyCompleted: true };
    }

    // Verify per type
    const cfg = (obj.config ?? {}) as Record<string, unknown>;
    let verified = false;
    let reason = "";

    switch (obj.objective_type) {
      case "gps_checkin":
      case "visit_location": {
        const targetLat = Number(cfg.latitude);
        const targetLng = Number(cfg.longitude);
        const radius = Number(cfg.radius_m ?? 60);
        const maxAcc = Number(cfg.min_accuracy_m ?? 200);
        if (Number.isFinite(targetLat) && Number.isFinite(targetLng)) {
          if (data.payload.latitude == null || data.payload.longitude == null) {
            reason = "Location required";
          } else if ((data.payload.accuracy ?? 0) > maxAcc) {
            reason = `GPS accuracy too low (${Math.round(data.payload.accuracy ?? 0)}m)`;
          } else {
            const dist = haversineMeters(
              { lat: data.payload.latitude, lng: data.payload.longitude },
              { lat: targetLat, lng: targetLng },
            );
            if (dist <= radius) verified = true;
            else reason = `You're ${Math.round(dist)}m away — get within ${radius}m`;
          }
        } else {
          // No target configured — accept as manual visit
          verified = true;
        }
        break;
      }
      case "scan_qr": {
        const expected = String(cfg.code ?? "").trim();
        if (!expected) verified = !!data.payload.code; // no expected code → accept any scan
        else if ((data.payload.code ?? "").trim() === expected) verified = true;
        else reason = "That QR doesn't match this objective";
        break;
      }
      case "answer_trivia": {
        const correct = Number(cfg.correct_index);
        if (Number.isFinite(correct) && data.payload.choiceIndex === correct) verified = true;
        else reason = "That's not the correct answer";
        break;
      }
      case "take_photo": {
        if (data.payload.photoPath && data.payload.photoPath.length > 0) verified = true;
        else reason = "Photo required";
        break;
      }
      case "collect_item":
      case "custom":
      default: {
        verified = true;
        break;
      }
    }

    const attempts = (existingProgress?.attempts ?? 0) + 1;
    const verificationData = {
      ...data.payload,
      verifiedReason: reason || undefined,
    };

    if (existingProgress) {
      const { error: uErr } = await sb
        .from("objective_progress")
        .update({
          status: verified ? "completed" : "failed",
          verification_data: verificationData,
          attempts,
          verified_at: verified ? new Date().toISOString() : null,
        })
        .eq("id", existingProgress.id);
      if (uErr) throw uErr;
    } else {
      const { error: iErr } = await sb.from("objective_progress").insert({
        session_id: session.id,
        objective_id: obj.id,
        user_id: context.userId,
        status: verified ? "completed" : "failed",
        verification_data: verificationData,
        attempts,
        verified_at: verified ? new Date().toISOString() : null,
      });
      if (iErr) throw iErr;
    }

    // Bump session activity
    await sb
      .from("quest_sessions")
      .update({ last_activity_at: new Date().toISOString(), status: "active" })
      .eq("id", session.id);

    // Check completion — all required objectives completed?
    let questCompleted = false;
    let xpAward: {
      xp_earned: number;
      old_level: number;
      new_level: number;
      level_up: boolean;
      lifetime_xp: number;
      current_level_xp: number;
      xp_for_next: number;
      already_awarded: boolean;
    } | null = null;
    if (verified) {
      const { data: allObjs } = await sb
        .from("quest_objectives")
        .select("id, required")
        .eq("quest_id", session.quest_id);
      const { data: allProg } = await sb
        .from("objective_progress")
        .select("objective_id, status")
        .eq("session_id", session.id);
      const completedIds = new Set((allProg ?? []).filter((p) => p.status === "completed").map((p) => p.objective_id));
      const remainingRequired = (allObjs ?? []).filter((o) => o.required && !completedIds.has(o.id));
      if (remainingRequired.length === 0 && (allObjs ?? []).length > 0) {
        await sb
          .from("quest_sessions")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", session.id);
        questCompleted = true;
        // Award XP idempotently via the progression service.
        const { data: award, error: aErr } = await sb.rpc("award_quest_completion_xp", {
          _session_id: session.id,
        });
        if (!aErr && award) xpAward = award as unknown as typeof xpAward;
      }
    }

    return { ok: verified, reason, questCompleted, xpAward };
  });

// ---- Pause / abandon ----
export const setSessionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        status: z.enum(["active", "paused", "abandoned"]),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("quest_sessions")
      .update({ status: data.status, last_activity_at: new Date().toISOString() })
      .eq("id", data.sessionId)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ---- List my sessions (resume UI) ----
export const listMySessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quest_sessions")
      .select("id, status, started_at, last_activity_at, completed_at, quest_id, quests(title, slug, cover_image_url, category)")
      .eq("user_id", context.userId)
      .order("last_activity_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

// ---- Upload photo (returns signed upload URL path convention) ----
// The client uploads directly to storage; server just returns the target path.
export const buildPhotoUploadPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ sessionId: z.string().uuid(), ext: z.string().max(6).default("jpg") }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const path = `submissions/${context.userId}/${data.sessionId}/${Date.now()}.${data.ext}`;
    return { path };
  });