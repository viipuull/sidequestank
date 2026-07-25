import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Camera, Check, Loader2, MapPin, X } from "lucide-react";
import { ScreenShell } from "@/components/onboarding/ScreenShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { sendWelcomeEmail } from "@/lib/founder.functions";

export const Route = createFileRoute("/profile-setup")({
  head: () => ({
    meta: [
      { title: "Create your profile — SideQuest" },
      { name: "description", content: "Pick a username and display name to start playing SideQuest." },
      { property: "og:title", content: "Create your profile — SideQuest" },
      { property: "og:description", content: "Pick a username and display name to start playing SideQuest." },
    ],
  }),
  component: ProfileSetup,
});

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";
const CYBERSHIKARI_EMAIL = "vipulgarg874@gmail.com";

function isReservedUsername(raw: string): boolean {
  const normalized = raw.toLowerCase().replace(/[\s_.\-]/g, "");
  return normalized.includes("sidequest") || normalized === "cybershikari";
}

function ProfileSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { data: existing, isLoading: profileLoading } = useProfile(user?.id);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "taken" | "available" | "invalid">("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
    if (existing) navigate({ to: "/tutorial" });
  }, [authLoading, user, existing, navigate]);

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata || {};
    setDisplayName((v) => v || meta.full_name || meta.name || "");
    if (!avatarPreview && meta.avatar_url) setAvatarPreview(meta.avatar_url);
  }, [user, avatarPreview]);

  const displayValid = displayName.trim().length >= 2 && displayName.trim().length <= 30;

  useEffect(() => {
    if (!username) return setUsernameStatus("idle");
    if (!USERNAME_RE.test(username)) return setUsernameStatus("invalid");
    const email = (user?.email ?? "").toLowerCase();
    const normalized = username.toLowerCase().replace(/[\s_.\-]/g, "");
    const ownsReserved =
      (email === FOUNDER_EMAIL && normalized.includes("sidequest")) ||
      (email === CYBERSHIKARI_EMAIL && normalized === "cybershikari");
    if (!ownsReserved && isReservedUsername(username)) {
      setUsernameStatus("taken");
      return;
    }
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 350);
    return () => clearTimeout(t);
  }, [username, user]);

  const initials = useMemo(() => {
    const source = displayName.trim() || username || "SQ";
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("");
  }, [displayName, username]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const canSubmit = usernameStatus === "available" && displayValid && !saving;

  const submit = async () => {
    if (!user || !canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      let avatar_url: string | null = avatarPreview;
      if (avatarFile) {
        // No storage bucket set up — keep object URL fallback: store nothing, use initials avatar.
        avatar_url = null;
      }
      const { error: insErr } = await supabase.from("profiles").insert({
        id: user.id,
        username,
        display_name: displayName.trim(),
        avatar_url,
      });
      if (insErr) throw insErr;
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      // Fire-and-forget welcome email (provider not yet connected — see founder.functions.ts).
      void sendWelcomeEmail({ data: { displayName: displayName.trim() } }).catch((err) => {
        console.warn("[welcome-email] failed to queue:", err);
      });
      navigate({ to: "/tutorial" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create profile");
      setSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <ScreenShell>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ScreenShell>
    );
  }

  const usernameHint = () => {
    switch (usernameStatus) {
      case "invalid":
        return { text: "3–20 chars: letters, numbers, underscores.", tone: "text-destructive" };
      case "checking":
        return { text: "Checking availability…", tone: "text-muted-foreground" };
      case "taken":
        return {
          text:
            isReservedUsername(username)
              ? "This username is already taken."
              : "That username is taken.",
          tone: "text-destructive",
        };
      case "available":
        return { text: "Available — this is permanent.", tone: "text-[color:var(--success)]" };
      default:
        return { text: "Permanent. Letters, numbers, underscores.", tone: "text-muted-foreground" };
    }
  };
  const hint = usernameHint();

  return (
    <ScreenShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create your explorer</h1>
        <p className="mt-1 text-sm text-muted-foreground">This is how the city will know you.</p>
      </div>

      <motion.div
        className="my-6 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-primary/40">
            {avatarPreview && <AvatarImage src={avatarPreview} alt="Avatar preview" />}
            <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">
              {initials || "SQ"}
            </AvatarFallback>
          </Avatar>
          <label className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          </label>
          {avatarPreview && (
            <button
              type="button"
              onClick={() => {
                setAvatarPreview(null);
                setAvatarFile(null);
              }}
              className="absolute -left-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Photo optional — we'll use your initials.</p>
      </motion.div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setUsername(e.target.value.trim())}
            placeholder="e.g. pranav_explorer"
            className="h-12"
          />
          <p className={`flex items-center gap-1 text-xs ${hint.tone}`}>
            {usernameStatus === "available" && <Check className="h-3.5 w-3.5" />}
            {hint.text}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="display">Display name</Label>
          <Input
            id="display"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Pranav ✨"
            maxLength={30}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            2–30 characters. You can change this later.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20 text-accent">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Current city</p>
            <p className="text-sm font-semibold">Ankleshwar, Gujarat</p>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            More coming
          </span>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      <div className="mt-auto pt-6">
        <Button size="lg" className="h-14 w-full text-base font-semibold" disabled={!canSubmit} onClick={submit}>
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create profile"}
        </Button>
      </div>
    </ScreenShell>
  );
}