import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Copy, Loader2, Plus, Search, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/layout/AuthGate";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RARITY_STYLES } from "@/lib/hooks/useTitles";
import {
  founderArchiveAchievement,
  founderAssignAchievement,
  founderDuplicateAchievement,
  founderListAchievements,
  founderSaveAchievement,
  founderSearchPlayers,
  type AchievementRow,
} from "@/lib/achievements.functions";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";
const RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "mythic"] as const;
const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
const CATEGORIES = [
  "explorer",
  "quest_completion",
  "level_progression",
  "location_discovery",
  "collection",
  "community",
  "founder",
  "special_event",
  "seasonal",
  "hidden",
  "secret",
];
const UNLOCK_TYPES = [
  "level_reached",
  "quests_completed",
  "specific_quest",
  "title_earned",
  "pioneer",
  "founder",
  "manual",
];

export const Route = createFileRoute("/founder/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — Founder Studio — SideQuest" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (<AuthGate><FounderAchievementsPage /></AuthGate>),
});

type AchForm = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  rarity: (typeof RARITIES)[number];
  icon: string;
  color: string;
  unlock_type: string;
  unlock_requirement: Record<string, string | number | boolean | null>;
  goal_target: number;
  hidden: boolean;
  secret: boolean;
  active: boolean;
  xp_bonus: number;
  display_order: number;
};

const emptyForm: AchForm = {
  name: "",
  slug: "",
  description: "",
  category: "explorer",
  difficulty: "easy",
  rarity: "common",
  icon: "🏅",
  color: "",
  unlock_type: "level_reached",
  unlock_requirement: { level: 5 },
  goal_target: 5,
  hidden: false,
  secret: false,
  active: true,
  xp_bonus: 0,
  display_order: 100,
};

function FounderAchievementsPage() {
  const { user } = useAuth();
  const list = useServerFn(founderListAchievements);
  const save = useServerFn(founderSaveAchievement);
  const archive = useServerFn(founderArchiveAchievement);
  const duplicate = useServerFn(founderDuplicateAchievement);
  const qc = useQueryClient();

  const isFounder = user?.email?.toLowerCase() === FOUNDER_EMAIL;

  const listQ = useQuery({
    queryKey: ["founder-achievements"],
    enabled: isFounder,
    queryFn: () => list(),
  });

  const [editing, setEditing] = useState<AchForm | null>(null);
  const [assigning, setAssigning] = useState<AchievementRow | null>(null);
  const [q, setQ] = useState("");

  const saveMut = useMutation({
    mutationFn: (form: AchForm) => save({ data: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["founder-achievements"] });
      qc.invalidateQueries({ queryKey: ["achievements-catalog"] });
      toast.success("Saved");
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
  const archiveMut = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => archive({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["founder-achievements"] }),
  });
  const dupMut = useMutation({
    mutationFn: (id: string) => duplicate({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["founder-achievements"] });
      toast.success("Duplicated");
    },
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (listQ.data ?? []).filter((a) => {
      if (!t) return true;
      return a.name.toLowerCase().includes(t) || a.slug.toLowerCase().includes(t) || a.category.toLowerCase().includes(t);
    });
  }, [listQ.data, q]);

  if (!isFounder) {
    return (
      <div className="mx-auto mt-24 max-w-md px-6 text-center">
        <p className="text-sm text-muted-foreground">Founders only.</p>
        <Link to="/home" className="mt-4 inline-block text-primary underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background pb-24">
      <header className="mx-auto flex max-w-2xl items-center justify-between p-4">
        <Link to="/founder" className="inline-flex items-center gap-1 text-sm text-muted-foreground active:scale-95">
          <ArrowLeft className="h-4 w-4" /> Founder
        </Link>
        <Button size="sm" onClick={() => setEditing({ ...emptyForm })}>
          <Plus className="mr-1 h-4 w-4" /> New
        </Button>
      </header>
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="text-xl font-bold">Achievements</h1>
        <p className="text-xs text-muted-foreground">Design, edit, archive, duplicate, and assign badges.</p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
        </div>

        {listQ.isLoading ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-4 space-y-2">
            {filtered.map((a) => {
              const s = RARITY_STYLES[a.rarity] ?? RARITY_STYLES.common;
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 rounded-2xl border p-3 backdrop-blur ${s.ring}`}
                  style={{ background: a.active ? s.bg : "oklch(0.14 0.02 260 / 0.4)" }}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: s.bg }}>
                    {a.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.name} {!a.active && <span className="text-[10px] text-muted-foreground">(archived)</span>}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.label} · {a.category} · {a.unlock_type}
                      {a.hidden ? " · hidden" : ""}{a.secret ? " · secret" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditing(toForm(a))}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => dupMut.mutate(a.id)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAssigning(a)}>
                      <UserPlus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => archiveMut.mutate({ id: a.id, active: !a.active })}
                    >
                      {a.active ? "Archive" : "Restore"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <EditSheet
            form={editing}
            onChange={setEditing}
            onClose={() => setEditing(null)}
            onSave={() => saveMut.mutate(editing)}
            saving={saveMut.isPending}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {assigning && <AssignSheet achievement={assigning} onClose={() => setAssigning(null)} />}
      </AnimatePresence>
    </div>
  );
}

function toForm(a: AchievementRow): AchForm {
  return {
    id: a.id,
    name: a.name,
    slug: a.slug,
    description: a.description,
    category: a.category,
    difficulty: a.difficulty,
    rarity: a.rarity,
    icon: a.icon,
    color: a.color ?? "",
    unlock_type: a.unlock_type,
    unlock_requirement: (a.unlock_requirement as AchForm["unlock_requirement"]) ?? {},
    goal_target: a.goal_target,
    hidden: a.hidden,
    secret: a.secret,
    active: a.active,
    xp_bonus: a.xp_bonus,
    display_order: a.display_order,
  };
}

function EditSheet({
  form, onChange, onClose, onSave, saving,
}: {
  form: AchForm;
  onChange: (f: AchForm) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof AchForm>(k: K, v: AchForm[K]) => onChange({ ...form, [k]: v });
  const setReq = (k: string, v: string | number) =>
    onChange({ ...form, unlock_requirement: { ...form.unlock_requirement, [k]: v } });
  const isNew = !form.id;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-end bg-background/70 backdrop-blur-md sm:place-items-center"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{isNew ? "New achievement" : "Edit achievement"}</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Icon</Label>
              <Input value={form.icon} onChange={(e) => set("icon", e.target.value)} maxLength={4} />
            </div>
            <div>
              <Label>Color</Label>
              <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="#a855f7" />
            </div>
            <div>
              <Label>Order</Label>
              <Input type="number" value={form.display_order} onChange={(e) => set("display_order", Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Rarity" value={form.rarity} onChange={(v) => set("rarity", v as AchForm["rarity"])} options={RARITIES as unknown as string[]} />
            <Select label="Difficulty" value={form.difficulty} onChange={(v) => set("difficulty", v)} options={DIFFICULTIES} />
            <Select label="Category" value={form.category} onChange={(v) => set("category", v)} options={CATEGORIES} custom />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Unlock type" value={form.unlock_type} onChange={(v) => set("unlock_type", v)} options={UNLOCK_TYPES} />
            <div>
              <Label>Goal target</Label>
              <Input type="number" min={1} value={form.goal_target} onChange={(e) => set("goal_target", Number(e.target.value))} />
            </div>
          </div>
          <UnlockConfig form={form} setReq={setReq} />
          <div>
            <Label>XP bonus (future)</Label>
            <Input type="number" min={0} value={form.xp_bonus} onChange={(e) => set("xp_bonus", Number(e.target.value))} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Toggle checked={form.active} onChange={(v) => set("active", v)}>Active</Toggle>
            <Toggle checked={form.hidden} onChange={(v) => set("hidden", v)}>Hidden until unlocked</Toggle>
            <Toggle checked={form.secret} onChange={(v) => set("secret", v)}>Secret (?? mask)</Toggle>
          </div>

          <PreviewCard form={form} />
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={onSave} disabled={saving || !form.name || !form.slug}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UnlockConfig({
  form, setReq,
}: {
  form: AchForm;
  setReq: (k: string, v: string | number) => void;
}) {
  const req = form.unlock_requirement;
  switch (form.unlock_type) {
    case "level_reached":
      return (
        <div>
          <Label>Required level</Label>
          <Input type="number" min={1} value={String(req.level ?? "")} onChange={(e) => setReq("level", Number(e.target.value))} />
        </div>
      );
    case "quests_completed":
      return (
        <div>
          <Label>Quest count</Label>
          <Input type="number" min={1} value={String(req.count ?? "")} onChange={(e) => setReq("count", Number(e.target.value))} />
        </div>
      );
    case "specific_quest":
      return (
        <div>
          <Label>Quest slug</Label>
          <Input value={String(req.quest_slug ?? "")} onChange={(e) => setReq("quest_slug", e.target.value)} />
        </div>
      );
    case "title_earned":
      return (
        <div>
          <Label>Title slug</Label>
          <Input value={String(req.title_slug ?? "")} onChange={(e) => setReq("title_slug", e.target.value)} />
        </div>
      );
    default:
      return (
        <p className="rounded-xl border border-dashed border-border p-2 text-[11px] text-muted-foreground">
          No extra configuration needed — this achievement is granted automatically by the engine or via founder assignment.
        </p>
      );
  }
}

function PreviewCard({ form }: { form: AchForm }) {
  const s = RARITY_STYLES[form.rarity] ?? RARITY_STYLES.common;
  return (
    <div className={`rounded-2xl border p-4 ${s.ring}`} style={{ background: s.bg, boxShadow: s.glow }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: s.text }}>
        Preview · {s.label}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl text-2xl" style={{ background: s.bg }}>
          {form.icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{form.name || "Achievement name"}</p>
          <p className="line-clamp-2 text-[11px] text-muted-foreground">{form.description || "How players earn this."}</p>
        </div>
      </div>
    </div>
  );
}

function Select({
  label, value, onChange, options, custom = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  custom?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
        {custom && !options.includes(value) && <option value={value}>{value}</option>}
      </select>
    </div>
  );
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

function AssignSheet({ achievement, onClose }: { achievement: AchievementRow; onClose: () => void }) {
  const search = useServerFn(founderSearchPlayers);
  const assign = useServerFn(founderAssignAchievement);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const results = useQuery({
    queryKey: ["founder-players-ach", debounced],
    queryFn: () => search({ data: { q: debounced } }),
  });
  const mut = useMutation({
    mutationFn: (userId: string) => assign({ data: { userId, achievementId: achievement.id } }),
    onSuccess: () => toast.success("Assigned"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-end bg-background/70 backdrop-blur-md sm:place-items-center"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="max-h-[80svh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Assign</p>
            <h2 className="text-base font-semibold">{achievement.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players by username or name" />
        <div className="mt-3 space-y-2">
          {(results.data ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.display_name}</p>
                <p className="text-[11px] text-muted-foreground">@{p.username}</p>
              </div>
              <Button size="sm" onClick={() => mut.mutate(p.id)} disabled={mut.isPending}>
                Assign
              </Button>
            </div>
          ))}
          {results.data && results.data.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">No players found.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}