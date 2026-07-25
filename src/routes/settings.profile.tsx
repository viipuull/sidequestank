import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, UserRound } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { getMySocialSettings, updateMySocialSettings } from "@/lib/social.functions";

export const Route = createFileRoute("/settings/profile")({
  head: () => ({ meta: [
    { title: "Edit Profile — SideQuest" },
    { name: "description", content: "Update your display name, avatar, and bio." },
    { name: "robots", content: "noindex" },
  ]}),
  component: () => (<AuthGate><EditProfilePage /></AuthGate>),
});

function EditProfilePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const fetchSocial = useServerFn(getMySocialSettings);
  const updateSocial = useServerFn(updateMySocialSettings);
  const socialQ = useQuery({ queryKey: ["my-social-settings"], queryFn: () => fetchSocial(), enabled: !!user });

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (profile) { setDisplayName(profile.display_name ?? ""); setAvatarUrl(profile.avatar_url ?? ""); } }, [profile]);
  useEffect(() => { if (socialQ.data) setBio(socialQ.data.bio ?? ""); }, [socialQ.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const name = displayName.trim();
      if (name.length < 2 || name.length > 30) throw new Error("Display name must be 2–30 characters.");
      const { error: e1 } = await supabase.from("profiles").update({
        display_name: name,
        avatar_url: avatarUrl.trim() || null,
      }).eq("id", user.id);
      if (e1) throw e1;
      await updateSocial({ data: { bio: bio.slice(0, 280) } });
    },
    onSuccess: async () => {
      setError(null);
      setSaved(true);
      await qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      await qc.invalidateQueries({ queryKey: ["my-social-settings"] });
      setTimeout(() => setSaved(false), 1800);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Could not save"),
  });

  const initials = (displayName || profile?.username || "SQ").split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

  return (
    <AppShell>
      <Link to="/settings" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Settings</Link>
      <header className="mt-3 flex items-center gap-2">
        <UserRound className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Edit profile</h1>
      </header>
      <p className="mt-1 text-xs text-muted-foreground">Your username @{profile?.username ?? "—"} is permanent.</p>

      <section className="mt-6 flex flex-col items-center">
        <Avatar className="h-24 w-24 border-2 border-primary/40">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
          <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">{initials || "SQ"}</AvatarFallback>
        </Avatar>
      </section>

      <section className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="avatar">Avatar image URL</Label>
          <Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" className="h-12" />
          <p className="text-[11px] text-muted-foreground">Paste any public image URL. Leave blank to use initials.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="display">Display name</Label>
          <Input id="display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={30} className="h-12" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3}
            className="w-full rounded-2xl border border-border bg-card/60 p-3 text-sm outline-none" placeholder="Say something about your adventures…" />
          <p className="text-[11px] text-muted-foreground">{bio.length}/280</p>
        </div>
      </section>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="flex-1 gap-2">
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saved ? "Saved" : "Save changes"}
        </Button>
        <Button variant="secondary" onClick={() => nav({ to: "/settings" })}>Cancel</Button>
      </div>
    </AppShell>
  );
}