import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, MapPin, QrCode, Camera, HelpCircle, Sparkles, Trophy, X, Pause } from "lucide-react";
import confetti from "canvas-confetti";
import { AuthGate } from "@/components/layout/AuthGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getActiveSessionForQuest,
  startOrResumeSession,
  getSessionState,
  submitObjective,
  setSessionStatus,
  buildPhotoUploadPath,
} from "@/lib/gameplay.functions";
import { getPublishedQuestBySlug } from "@/lib/quests.functions";
import { OBJECTIVE_TYPES } from "@/lib/quests.types";

export const Route = createFileRoute("/quests/$slug/play")({
  head: ({ params }) => ({
    meta: [
      { title: `Playing — ${params.slug} — SideQuest` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AuthGate>
      <PlayPage />
    </AuthGate>
  ),
});

function PlayPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getQuest = useServerFn(getPublishedQuestBySlug);
  const getActive = useServerFn(getActiveSessionForQuest);
  const startFn = useServerFn(startOrResumeSession);
  const getState = useServerFn(getSessionState);
  const setStatus = useServerFn(setSessionStatus);

  // Load quest (for id + hero) → then session → then state
  const { data: quest } = useQuery({
    queryKey: ["quest", slug],
    queryFn: () => getQuest({ data: { slug } }),
  });

  const { data: sessionId } = useQuery({
    queryKey: ["play-session-id", quest?.id],
    enabled: !!quest?.id,
    queryFn: async () => {
      const active = await getActive({ data: { questId: quest!.id } });
      if (active && active.status !== "completed" && active.status !== "abandoned") return active.id;
      const started = await startFn({ data: { questId: quest!.id } });
      return started.sessionId;
    },
  });

  const { data: state, refetch } = useQuery({
    queryKey: ["play-state", sessionId],
    enabled: !!sessionId,
    queryFn: () => getState({ data: { sessionId: sessionId! } }),
  });

  const [activeObjectiveId, setActiveObjectiveId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!state) return;
    if (state.session.status === "completed" && !firedRef.current) {
      firedRef.current = true;
      setShowCelebration(true);
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 }, colors: ["#a855f7", "#ec4899", "#22d3ee", "#f59e0b"] });
      setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { y: 0.4 } }), 300);
    }
  }, [state]);

  const objectives = state?.objectives ?? [];
  type ProgressRow = NonNullable<typeof state>["progress"][number];
  const progressById = useMemo(() => {
    const m = new Map<string, ProgressRow>();
    (state?.progress ?? []).forEach((p) => m.set(p.objective_id, p));
    return m;
  }, [state]);

  const completedCount = objectives.filter((o) => progressById.get(o.id)?.status === "completed").length;
  const pct = objectives.length ? Math.round((completedCount / objectives.length) * 100) : 0;

  async function pause() {
    if (!sessionId) return;
    await setStatus({ data: { sessionId, status: "paused" } });
    toast("Progress saved. Come back anytime.");
    navigate({ to: "/quests/$slug", params: { slug } });
  }

  async function abandon() {
    if (!sessionId) return;
    if (!confirm("Abandon this quest? Your progress on this attempt will be closed.")) return;
    await setStatus({ data: { sessionId, status: "abandoned" } });
    qc.invalidateQueries({ queryKey: ["quest-active-session"] });
    navigate({ to: "/quests/$slug", params: { slug } });
  }

  if (!quest || !sessionId || !state) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeObjective = objectives.find((o) => o.id === activeObjectiveId) ?? objectives.find((o) => progressById.get(o.id)?.status !== "completed") ?? null;

  return (
    <div className="relative min-h-[100dvh] bg-background pb-28 text-foreground" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2 px-5 py-3">
          <Link to="/quests/$slug" params={{ slug }} className="grid h-9 w-9 place-items-center rounded-full border border-border/60" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Playing</div>
            <h1 className="truncate text-sm font-bold">{quest.title}</h1>
          </div>
          <button onClick={pause} className="grid h-9 w-9 place-items-center rounded-full border border-border/60" aria-label="Pause">
            <Pause className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-auto max-w-md px-5 pb-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{completedCount} / {objectives.length} objectives</span>
            <span className="font-semibold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="mt-1 h-1.5" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-3 px-5 py-4">
        {objectives.map((o, i) => {
          const p = progressById.get(o.id);
          const done = p?.status === "completed";
          const failed = p?.status === "failed";
          const t = OBJECTIVE_TYPES.find((x) => x.value === o.objective_type);
          const isActive = activeObjective?.id === o.id;
          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-2xl border p-4 ${done ? "border-primary/40 bg-primary/5" : isActive ? "border-primary bg-card/80" : "border-border/60 bg-card/60"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{o.title}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{t?.emoji} {t?.label}</span>
                  </div>
                  {o.description && <p className="mt-0.5 text-xs text-muted-foreground">{o.description}</p>}
                  {failed && p?.verification_data && typeof (p.verification_data as { verifiedReason?: string }).verifiedReason === "string" && (
                    <p className="mt-1 text-[11px] text-destructive">{(p.verification_data as { verifiedReason?: string }).verifiedReason}</p>
                  )}
                </div>
                {!done && (
                  <Button size="sm" variant={isActive ? "default" : "outline"} className="rounded-full" onClick={() => setActiveObjectiveId(o.id)}>
                    Verify
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}

        <button onClick={abandon} className="mx-auto mt-6 block text-[11px] text-muted-foreground underline">Abandon quest</button>
      </main>

      <AnimatePresence>
        {activeObjective && progressById.get(activeObjective.id)?.status !== "completed" && (
          <VerificationSheet
            key={activeObjective.id}
            sessionId={sessionId}
            objective={activeObjective}
            onClose={() => setActiveObjectiveId(null)}
            onSuccess={() => {
              setActiveObjectiveId(null);
              qc.invalidateQueries({ queryKey: ["play-state", sessionId] });
              refetch();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCelebration && (
          <CompletionOverlay
            xp={quest.reward_xp}
            title={quest.title}
            onClose={() => {
              setShowCelebration(false);
              navigate({ to: "/quests/$slug", params: { slug } });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ Verification Sheet ============

type Objective = NonNullable<Awaited<ReturnType<typeof getSessionState>>>["objectives"][number];
// The above typeof will not resolve since getSessionState is a stub client-side; use loose type.
type ObjectiveLike = {
  id: string;
  title: string;
  description: string;
  objective_type: string;
  config: unknown;
};

function VerificationSheet({
  sessionId, objective, onClose, onSuccess,
}: {
  sessionId: string;
  objective: ObjectiveLike;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const submit = useServerFn(submitObjective);
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      submit({ data: { sessionId, objectiveId: objective.id, payload } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(r.questCompleted ? "Quest complete! 🎉" : "Objective verified ✨");
        onSuccess();
      } else {
        toast.error(r.reason || "Verification failed");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-3xl border-t border-border/60 bg-card/95 p-5 shadow-2xl backdrop-blur-xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Verify</div>
            <h2 className="text-base font-bold leading-tight">{objective.title}</h2>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-border/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-4">
          {objective.objective_type === "gps_checkin" || objective.objective_type === "visit_location" ? (
            <GpsVerifier disabled={mutation.isPending} onSubmit={(payload) => mutation.mutate(payload)} />
          ) : objective.objective_type === "scan_qr" ? (
            <QrVerifier disabled={mutation.isPending} onSubmit={(payload) => mutation.mutate(payload)} />
          ) : objective.objective_type === "answer_trivia" ? (
            <TriviaVerifier config={(objective.config as Record<string, unknown>) ?? {}} disabled={mutation.isPending} onSubmit={(payload) => mutation.mutate(payload)} />
          ) : objective.objective_type === "take_photo" ? (
            <PhotoVerifier sessionId={sessionId} disabled={mutation.isPending} onSubmit={(payload) => mutation.mutate(payload)} />
          ) : (
            <ManualVerifier disabled={mutation.isPending} onSubmit={(payload) => mutation.mutate(payload)} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function GpsVerifier({ onSubmit, disabled }: { onSubmit: (p: Record<string, unknown>) => void; disabled?: boolean }) {
  const [loc, setLoc] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(false);
  function fetchLocation() {
    if (!("geolocation" in navigator)) { toast.error("Location not available"); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLoc(pos); setLoading(false); },
      (err) => { toast.error(err.message || "Location denied"); setLoading(false); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Head to the location and tap the button to check in.</p>
      <Button variant="outline" className="w-full" onClick={fetchLocation} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />} Get my location
      </Button>
      {loc && (
        <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-[11px] text-muted-foreground">
          <div>Lat: {loc.coords.latitude.toFixed(5)}</div>
          <div>Lng: {loc.coords.longitude.toFixed(5)}</div>
          <div>Accuracy: ±{Math.round(loc.coords.accuracy)}m</div>
        </div>
      )}
      <Button className="h-12 w-full rounded-2xl text-sm font-bold" disabled={disabled || !loc} onClick={() => loc && onSubmit({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      })}>
        {disabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Check in
      </Button>
    </div>
  );
}

function QrVerifier({ onSubmit, disabled }: { onSubmit: (p: Record<string, unknown>) => void; disabled?: boolean }) {
  const containerId = "sq-qr-reader";
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  useEffect(() => {
    return () => { void scannerRef.current?.stop().catch(() => {}); };
  }, []);

  async function start() {
    setScanning(true);
    try {
      const mod = await import("html5-qrcode");
      const Html5Qrcode = mod.Html5Qrcode;
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner as unknown as { stop: () => Promise<void>; clear: () => void };
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await scanner.stop();
          setScanning(false);
          onSubmit({ code: decoded });
        },
        () => {},
      );
    } catch (e) {
      setScanning(false);
      toast.error(e instanceof Error ? e.message : "Camera unavailable");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Point your camera at the quest QR code.</p>
      <div id={containerId} className="mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-border/60 bg-black/40" />
      {!scanning ? (
        <Button variant="outline" className="w-full" onClick={start}>
          <QrCode className="mr-2 h-4 w-4" /> Start camera
        </Button>
      ) : (
        <p className="text-center text-[11px] text-muted-foreground">Scanning…</p>
      )}
      <div className="pt-2">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">or enter manually</div>
        <div className="flex gap-2">
          <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="QR code text"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <Button disabled={disabled || !manual.trim()} onClick={() => onSubmit({ code: manual.trim() })}>Submit</Button>
        </div>
      </div>
    </div>
  );
}

function TriviaVerifier({ config, onSubmit, disabled }: { config: Record<string, unknown>; onSubmit: (p: Record<string, unknown>) => void; disabled?: boolean }) {
  const question = String(config.question ?? "Answer the question");
  const choices = Array.isArray(config.choices) ? (config.choices as string[]) : [];
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/40 p-3">
        <HelpCircle className="mt-0.5 h-4 w-4 text-primary" />
        <p className="text-sm font-medium">{question}</p>
      </div>
      <div className="space-y-2">
        {choices.map((c, idx) => (
          <button
            key={idx}
            onClick={() => setPick(idx)}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all active:scale-[0.99] ${
              pick === idx ? "border-primary bg-primary/10" : "border-border/60 bg-background/40"
            }`}
          >
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${pick === idx ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="min-w-0 flex-1">{c}</span>
          </button>
        ))}
      </div>
      <Button className="h-12 w-full rounded-2xl text-sm font-bold" disabled={disabled || pick == null} onClick={() => pick != null && onSubmit({ choiceIndex: pick })}>
        {disabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Submit answer
      </Button>
    </div>
  );
}

function PhotoVerifier({ sessionId, onSubmit, disabled }: { sessionId: string; onSubmit: (p: Record<string, unknown>) => void; disabled?: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const buildPath = useServerFn(buildPhotoUploadPath);

  async function handleFile(file: File) {
    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
      const { path } = await buildPath({ data: { sessionId, ext } });
      const { error } = await supabase.storage.from("quest-media").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type || "image/jpeg",
      });
      if (error) throw error;
      setUploadedPath(path);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Snap a photo that proves you completed this objective.</p>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
      {previewUrl ? (
        <img src={previewUrl} alt="Preview" className="mx-auto aspect-square w-full max-w-[280px] rounded-2xl object-cover" />
      ) : (
        <button onClick={() => inputRef.current?.click()}
          className="grid aspect-square w-full max-w-[280px] mx-auto place-items-center rounded-2xl border-2 border-dashed border-border/60 bg-background/40 text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Camera className="h-8 w-8" />
            <span className="text-xs">Tap to take a photo</span>
          </div>
        </button>
      )}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => { setPreviewUrl(null); setUploadedPath(null); inputRef.current?.click(); }} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />} {previewUrl ? "Retake" : "Choose"}
        </Button>
        <Button className="flex-1" disabled={disabled || !uploadedPath} onClick={() => uploadedPath && onSubmit({ photoPath: uploadedPath })}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Submit
        </Button>
      </div>
    </div>
  );
}

function ManualVerifier({ onSubmit, disabled }: { onSubmit: (p: Record<string, unknown>) => void; disabled?: boolean }) {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Mark this objective complete on the honor system.</p>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      <Button className="h-12 w-full rounded-2xl text-sm font-bold" disabled={disabled} onClick={() => onSubmit({ note })}>
        <CheckCircle2 className="mr-2 h-4 w-4" /> Mark complete
      </Button>
    </div>
  );
}

function CompletionOverlay({ xp, title, onClose }: { xp: number; title: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-background/85 backdrop-blur-md p-6"
    >
      <motion.div
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 220 }}
        className="w-full max-w-sm rounded-3xl border border-border/60 bg-card p-6 text-center shadow-2xl"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary via-fuchsia-500 to-amber-400 shadow-xl">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <h2 className="mt-4 text-xl font-bold">Quest Complete!</h2>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Badge className="rounded-full bg-primary text-primary-foreground">
            <Sparkles className="mr-1 h-3 w-3" /> +{xp} XP
          </Badge>
        </div>
        <Button className="mt-6 h-12 w-full rounded-2xl text-sm font-bold" onClick={onClose}>
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}