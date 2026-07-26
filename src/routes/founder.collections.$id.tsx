import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Trash2, ChevronUp, ChevronDown, Plus, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  founderListCollections,
  founderSaveCollection,
  founderSetCollectionItems,
  founderListQuestsForPicker,
  founderListTitlesForPicker,
  founderListAchievementsForPicker,
  getCollectionBySlug,
} from "@/lib/collections.functions";
import { MediaField } from "@/components/media/MediaPicker";

export const Route = createFileRoute("/founder/collections/$id")({
  head: () => ({ meta: [
    { title: "Edit Collection — SideQuest Studio" },
    { name: "robots", content: "noindex" },
  ] }),
  component: EditCollectionPage,
});

type QuestPick = { quest_id: string; completion_order: number; required: boolean };

function EditCollectionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const listFn = useServerFn(founderListCollections);
  const saveFn = useServerFn(founderSaveCollection);
  const setItemsFn = useServerFn(founderSetCollectionItems);
  const questsFn = useServerFn(founderListQuestsForPicker);
  const titlesFn = useServerFn(founderListTitlesForPicker);
  const achFn = useServerFn(founderListAchievementsForPicker);
  const detailFn = useServerFn(getCollectionBySlug);

  const listQ = useQuery({ queryKey: ["founder-collections"], queryFn: () => listFn({}) });
  const current = useMemo(() => (listQ.data ?? []).find((c) => c.id === id) ?? null, [listQ.data, id]);

  const detailQ = useQuery({
    queryKey: ["founder-collection-items", current?.slug],
    enabled: !!current?.slug,
    queryFn: () => detailFn({ data: { slug: current!.slug } }),
  });

  const questsQ = useQuery({ queryKey: ["founder-quests-picker"], queryFn: () => questsFn({}) });
  const titlesQ = useQuery({ queryKey: ["founder-titles-picker"], queryFn: () => titlesFn({}) });
  const achQ = useQuery({ queryKey: ["founder-achievements-picker"], queryFn: () => achFn({}) });

  const [form, setForm] = useState<{
    slug: string; name: string; description: string; icon: string;
    cover_image_url: string; banner_image_url: string;
    category: string; collection_type: string;
    difficulty: "easy" | "medium" | "hard" | "expert";
    visibility: "public" | "unlisted" | "private";
    status: "draft" | "published" | "archived";
    featured: boolean; seasonal: boolean; hidden: boolean; repeatable: boolean;
    estimated_minutes: number; display_order: number;
    reward_xp: number; reward_summary: string;
    reward_title_id: string; reward_achievement_id: string;
    tags: string; city: string;
  } | null>(null);

  const [items, setItems] = useState<QuestPick[]>([]);

  useEffect(() => {
    if (!current || form) return;
    setForm({
      slug: current.slug, name: current.name, description: current.description,
      icon: current.icon, cover_image_url: current.cover_image_url ?? "",
      banner_image_url: current.banner_image_url ?? "",
      category: current.category, collection_type: current.collection_type,
      difficulty: current.difficulty as "easy" | "medium" | "hard" | "expert",
      visibility: current.visibility as "public" | "unlisted" | "private",
      status: current.status as "draft" | "published" | "archived",
      featured: current.featured, seasonal: current.seasonal, hidden: current.hidden,
      repeatable: current.repeatable,
      estimated_minutes: current.estimated_minutes, display_order: current.display_order,
      reward_xp: current.reward_xp, reward_summary: current.reward_summary,
      reward_title_id: current.reward_title_id ?? "",
      reward_achievement_id: current.reward_achievement_id ?? "",
      tags: (current.tags ?? []).join(", "),
      city: current.city,
    });
  }, [current, form]);

  useEffect(() => {
    if (!detailQ.data || items.length > 0) return;
    setItems(
      detailQ.data.items.map((i) => ({
        quest_id: i.quest_id,
        completion_order: i.completion_order,
        required: i.required,
      })),
    );
  }, [detailQ.data, items.length]);

  if (listQ.isLoading || !form) {
    return <div className="grid min-h-[100dvh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!current) {
    return (
      <AppShell>
        <p className="mt-10 text-center text-sm text-muted-foreground">Collection not found.</p>
        <Link to="/founder/collections" className="mt-4 block text-center text-primary underline">Back</Link>
      </AppShell>
    );
  }

  async function handleSave(publish: boolean) {
    if (!form) return;
    try {
      await saveFn({
        data: {
          id: current!.id,
          slug: form.slug, name: form.name, description: form.description,
          icon: form.icon,
          cover_image_url: form.cover_image_url || null,
          banner_image_url: form.banner_image_url || null,
          category: form.category, collection_type: form.collection_type,
          difficulty: form.difficulty, visibility: form.visibility,
          status: publish ? "published" : form.status,
          featured: form.featured, seasonal: form.seasonal, hidden: form.hidden,
          repeatable: form.repeatable,
          estimated_minutes: form.estimated_minutes, display_order: form.display_order,
          reward_xp: form.reward_xp, reward_summary: form.reward_summary,
          reward_title_id: form.reward_title_id || null,
          reward_achievement_id: form.reward_achievement_id || null,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          city: form.city,
        },
      });
      await setItemsFn({
        data: {
          collectionId: current!.id,
          items: items.map((it, idx) => ({
            quest_id: it.quest_id,
            completion_order: idx,
            required: it.required,
          })),
        },
      });
      qc.invalidateQueries({ queryKey: ["founder-collections"] });
      qc.invalidateQueries({ queryKey: ["founder-collection-items"] });
      toast.success(publish ? "Published ✨" : "Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...items];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setItems(next);
  }

  const availableQuests = (questsQ.data ?? []).filter(
    (q) => !items.some((it) => it.quest_id === q.id),
  );

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Link to="/founder/collections" className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card/60">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Edit collection</p>
          <h1 className="truncate text-lg font-bold">{form.name || "Untitled"}</h1>
        </div>
        <Link
          to="/collections/$slug"
          params={{ slug: form.slug }}
          className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card/60"
          aria-label="Preview"
        >
          <Eye className="h-4 w-4" />
        </Link>
      </div>

      <section className="mt-4 space-y-3 rounded-3xl border border-border bg-card/60 p-4 backdrop-blur">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-primary">Basics</h2>
        <div className="grid grid-cols-4 gap-2">
          <Field label="Icon" className="col-span-1">
            <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="text-center text-lg" />
          </Field>
          <Field label="Name" className="col-span-3">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
        </div>
        <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
        <Field label="Description">
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Cover image">
            <MediaField value={form.cover_image_url} onChange={(url) => setForm({ ...form, cover_image_url: url })} />
          </Field>
          <Field label="Banner image">
            <MediaField value={form.banner_image_url} onChange={(url) => setForm({ ...form, banner_image_url: url })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Type">
            <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.collection_type} onChange={(e) => setForm({ ...form, collection_type: e.target.value })}>
              {["quest_series","food_trail","adventure_pack","seasonal","event","city_walk","heritage"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Difficulty">
            <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as typeof form.difficulty })}>
              {["easy","medium","hard","expert"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Visibility">
            <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as typeof form.visibility })}>
              {["public","unlisted","private"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
              {["draft","published","archived"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Order"><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value || "0", 10) })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Est. minutes"><Input type="number" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: parseInt(e.target.value || "0", 10) })} /></Field>
          <Field label="Tags (comma separated)"><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <Toggle label="Featured" value={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
          <Toggle label="Seasonal" value={form.seasonal} onChange={(v) => setForm({ ...form, seasonal: v })} />
          <Toggle label="Hidden" value={form.hidden} onChange={(v) => setForm({ ...form, hidden: v })} />
          <Toggle label="Repeatable" value={form.repeatable} onChange={(v) => setForm({ ...form, repeatable: v })} />
        </div>
      </section>

      <section className="mt-4 space-y-3 rounded-3xl border border-border bg-card/60 p-4 backdrop-blur">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-primary">Rewards on completion</h2>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Bonus XP"><Input type="number" value={form.reward_xp} onChange={(e) => setForm({ ...form, reward_xp: parseInt(e.target.value || "0", 10) })} /></Field>
          <Field label="Reward summary"><Input value={form.reward_summary} onChange={(e) => setForm({ ...form, reward_summary: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Reward title">
            <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.reward_title_id} onChange={(e) => setForm({ ...form, reward_title_id: e.target.value })}>
              <option value="">— none —</option>
              {(titlesQ.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name} ({t.rarity})</option>)}
            </select>
          </Field>
          <Field label="Reward badge">
            <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.reward_achievement_id} onChange={(e) => setForm({ ...form, reward_achievement_id: e.target.value })}>
              <option value="">— none —</option>
              {(achQ.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name} ({a.rarity})</option>)}
            </select>
          </Field>
        </div>
      </section>

      <section className="mt-4 space-y-2 rounded-3xl border border-border bg-card/60 p-4 backdrop-blur">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-primary">Quests · {items.length}</h2>
        <ol className="space-y-2">
          {items.map((it, idx) => {
            const meta = (questsQ.data ?? []).find((q) => q.id === it.quest_id);
            return (
              <li key={it.quest_id} className="flex items-center gap-2 rounded-2xl border border-border bg-background/40 p-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{idx + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{meta?.title ?? it.quest_id}</p>
                  <div className="flex gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>{meta?.status}</span>
                    <span>{meta?.difficulty}</span>
                    {!it.required && <Badge variant="outline" className="text-[9px]">Optional</Badge>}
                  </div>
                </div>
                <button onClick={() => setItems(items.map((x) => x.quest_id === it.quest_id ? { ...x, required: !x.required } : x))} className="rounded-lg border border-border px-2 py-1 text-[10px]">
                  {it.required ? "Req" : "Opt"}
                </button>
                <button onClick={() => move(idx, -1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><ChevronUp className="h-3 w-3" /></button>
                <button onClick={() => move(idx, 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><ChevronDown className="h-3 w-3" /></button>
                <button onClick={() => setItems(items.filter((x) => x.quest_id !== it.quest_id))} className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/40 text-destructive"><Trash2 className="h-3 w-3" /></button>
              </li>
            );
          })}
        </ol>
        <details className="mt-3 rounded-2xl border border-dashed border-border bg-background/30 p-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Plus className="mr-1 inline h-3 w-3" /> Add quests ({availableQuests.length})
          </summary>
          <div className="mt-2 max-h-64 space-y-1 overflow-auto">
            {availableQuests.map((q) => (
              <button
                key={q.id}
                onClick={() => setItems([...items, { quest_id: q.id, completion_order: items.length, required: true }])}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2 text-left text-xs active:scale-[0.99]"
              >
                <span className="min-w-0 truncate">{q.title}</span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{q.status} · {q.difficulty}</span>
              </button>
            ))}
            {availableQuests.length === 0 && <p className="text-[11px] text-muted-foreground">No more quests to add.</p>}
          </div>
        </details>
      </section>

      <div className="sticky bottom-24 mt-6 flex gap-2">
        <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => navigate({ to: "/founder/collections" })}>
          Back
        </Button>
        <Button variant="secondary" className="flex-1 rounded-2xl" onClick={() => handleSave(false)}>
          <Save className="mr-1 h-4 w-4" /> Save draft
        </Button>
        <Button className="flex-1 rounded-2xl" onClick={() => handleSave(true)}>
          Publish ✨
        </Button>
      </div>
    </AppShell>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`rounded-full border px-3 py-1 text-[11px] transition ${
        value ? "border-primary bg-primary/15 text-primary" : "border-border bg-background/40 text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}