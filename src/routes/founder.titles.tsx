import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Plus, Search, UserPlus, X } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  founderArchiveTitle,
  founderAssignTitle,
  founderListTitles,
  founderRemoveTitle,
  founderSaveTitle,
  founderSearchPlayers,
} from "@/lib/titles.functions";
import { RARITY_STYLES } from "@/lib/hooks/useTitles";
import { motion, AnimatePresence } from "framer-motion";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";

export const Route = createFileRoute("/founder/titles")({
  head: () => ({
    meta: [
      { title: "Titles — Founder Studio — SideQuest" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (<AuthGate><FounderTitlesPage /></AuthGate>),
});

type TitleForm = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  rarity: string;
  icon: string;
  color: string;
  unlock_type: string;
  unlock_requirement: Record<string, string | number | boolean | null>;
  display_order: number;
  hidden: boolean;
  active: boolean;
};

const EMPTY: TitleForm = {
  name: "",
  slug: "",
  description: "",
  category: "explorer",
  rarity: "common",
  icon: "🏷️",
  color: "oklch(0.72 0.16 300)",
  unlock_type: "manual",
  unlock_requirement: {},
  display_order: 100,
  hidden: false,
  active: true,
};

function FounderTitlesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL;
  useEffect(() => {
    if (loading) return;
    if (!isFounder) navigate({ to: "/home" });
  }, [loading, isFounder, navigate]);

  const listFn = useServerFn(founderListTitles);
  const qc = useQueryClient();
  const { data: titles, isLoading } = useQuery({
    queryKey: ["founder-titles"],
    enabled: isFounder,
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<TitleForm | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const saveFn = useServerFn(founderSaveTitle);
  const archiveFn = useServerFn(founderArchiveTitle);
  const save = useMutation({
    mutationFn: (payload: TitleForm) => saveFn({ data: payload }),
    onSuccess: () => {
      toast.success("Title saved");
      qc.invalidateQueries({ queryKey: ["founder-titles"] });
      qc.invalidateQueries({ queryKey: ["titles-catalog"] });
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
  const archive = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => archiveFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["founder-titles"] });
      qc.invalidateQueries({ queryKey: ["titles-catalog"] });
    },
  });

  if (!isFounder) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-16 text-foreground" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-5 py-3">
          <Link to="/founder" className="grid h-9 w-9 place-items-center rounded-full border border-border/60"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">Titles Manager</h1>
          <Button size="sm" className="ml-auto" onClick={() => setEditing({ ...EMPTY })}>
            <Plus className="mr-1 h-4 w-4" /> New title
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-5 py-5">
        {isLoading && <div className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>}
        {(titles ?? []).map((t) => {
          const s = RARITY_STYLES[t.rarity] ?? RARITY_STYLES.common;
          return (
            <div key={t.id} className={`rounded-2xl border p-3 backdrop-blur ${s.ring} ${!t.active ? "opacity-60" : ""}`} style={{ background: s.bg }}>
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-background/60 text-2xl">{t.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold" style={{ color: t.color ?? s.text }}>{t.name}</p>
                    <span className="rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ borderColor: s.text, color: s.text }}>
                      {t.rarity}
                    </span>
                    <span className="rounded-full bg-background/60 px-2 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">
                      {t.category}
                    </span>
                    {t.hidden && <span className="text-[9px] font-semibold uppercase text-muted-foreground">Hidden</span>}
                    {!t.active && <span className="text-[9px] font-semibold uppercase text-destructive">Archived</span>}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{t.description || "—"}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.unlock_type.replace(/_/g, " ")} · {JSON.stringify(t.unlock_requirement)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditing({
                      id: t.id, name: t.name, slug: t.slug, description: t.description,
                      category: t.category, rarity: t.rarity, icon: t.icon, color: t.color,
                      unlock_type: t.unlock_type,
                      unlock_requirement: (t.unlock_requirement as Record<string, string | number | boolean | null>) ?? {},
                      display_order: t.display_order, hidden: t.hidden, active: t.active,
                    })}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setAssigningId(t.id)}>
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => archive.mutate({ id: t.id, active: !t.active })}>
                    {t.active ? "Archive" : "Restore"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <AnimatePresence>
        {editing && (
          <TitleEditor
            value={editing}
            saving={save.isPending}
            onChange={setEditing}
            onCancel={() => setEditing(null)}
            onSave={(v) => save.mutate(v)}
          />
        )}
        {assigningId && (
          <AssignSheet titleId={assigningId} onClose={() => setAssigningId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function TitleEditor({
  value, saving, onChange, onCancel, onSave,
}: {
  value: TitleForm; saving: boolean;
  onChange: (v: TitleForm) => void;
  onCancel: () => void;
  onSave: (v: TitleForm) => void;
}) {
  const req = value.unlock_requirement ?? {};
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-end bg-background/70 backdrop-blur-sm sm:place-items-center" onClick={onCancel}>
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border/60 bg-card/95 p-5 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">{value.id ? "Edit title" : "New title"}</h2>
          <button onClick={onCancel} className="grid h-8 w-8 place-items-center rounded-full border border-border/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value, slug: value.slug || slugify(e.target.value) })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={value.slug} onChange={(e) => onChange({ ...value, slug: slugify(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Icon</Label>
              <Input value={value.icon} onChange={(e) => onChange({ ...value, icon: e.target.value.slice(0, 4) })} />
            </div>
            <div className="col-span-2">
              <Label>Color</Label>
              <Input value={value.color} onChange={(e) => onChange({ ...value, color: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={value.category} onChange={(v) => onChange({ ...value, category: v })}
              options={["explorer","adventure","completion","founder","seasonal","event","special","community","hidden"]} />
            <Select label="Rarity" value={value.rarity} onChange={(v) => onChange({ ...value, rarity: v })}
              options={["common","uncommon","rare","epic","legendary","mythic"]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Unlock type" value={value.unlock_type} onChange={(v) => onChange({ ...value, unlock_type: v, unlock_requirement: {} })}
              options={["manual","reach_level","quest_count","specific_quest","pioneer","founder","event"]} />
            <div>
              <Label>Display order</Label>
              <Input type="number" value={value.display_order} onChange={(e) => onChange({ ...value, display_order: Number(e.target.value) || 0 })} />
            </div>
          </div>
          {value.unlock_type === "reach_level" && (
            <div><Label>Required level</Label>
              <Input type="number" value={Number(req.level ?? 5)} onChange={(e) => onChange({ ...value, unlock_requirement: { level: Number(e.target.value) || 1 } })} /></div>
          )}
          {value.unlock_type === "quest_count" && (
            <div><Label>Required quest count</Label>
              <Input type="number" value={Number(req.count ?? 1)} onChange={(e) => onChange({ ...value, unlock_requirement: { count: Number(e.target.value) || 1 } })} /></div>
          )}
          {value.unlock_type === "specific_quest" && (
            <div><Label>Quest slug</Label>
              <Input value={String(req.quest_slug ?? "")} onChange={(e) => onChange({ ...value, unlock_requirement: { quest_slug: e.target.value } })} /></div>
          )}
          <div className="flex items-center gap-4 pt-2 text-xs">
            <label className="flex items-center gap-2"><input type="checkbox" checked={value.hidden} onChange={(e) => onChange({ ...value, hidden: e.target.checked })} /> Hidden</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={value.active} onChange={(e) => onChange({ ...value, active: e.target.checked })} /> Active</label>
          </div>
          <Button className="w-full" disabled={saving || !value.name || !value.slug} onClick={() => onSave(value)}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {value.id ? "Save changes" : "Create title"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
    </div>
  );
}

function AssignSheet({ titleId, onClose }: { titleId: string; onClose: () => void }) {
  const [q, setQ] = useState("");
  const searchFn = useServerFn(founderSearchPlayers);
  const assignFn = useServerFn(founderAssignTitle);
  const removeFn = useServerFn(founderRemoveTitle);
  const qc = useQueryClient();
  const { data: players, isLoading } = useQuery({
    queryKey: ["founder-players", q],
    queryFn: () => searchFn({ data: { q } }),
  });
  const assign = useMutation({
    mutationFn: (userId: string) => assignFn({ data: { userId, titleId } }),
    onSuccess: () => { toast.success("Title assigned"); qc.invalidateQueries({ queryKey: ["founder-titles"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeFn({ data: { userId, titleId } }),
    onSuccess: () => toast.success("Title removed"),
  });

  const list = useMemo(() => players ?? [], [players]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-end bg-background/70 backdrop-blur-sm sm:place-items-center" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border/60 bg-card/95 p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">Assign title</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-border/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search players" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="mt-3 space-y-2">
          {isLoading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />}
          {list.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {p.display_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.display_name}</p>
                <p className="truncate text-[11px] text-muted-foreground">@{p.username}</p>
              </div>
              <Button size="sm" variant="outline" disabled={remove.isPending} onClick={() => remove.mutate(p.id)}>Remove</Button>
              <Button size="sm" disabled={assign.isPending} onClick={() => assign.mutate(p.id)}>Assign</Button>
            </div>
          ))}
          {!isLoading && list.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No players.</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}
