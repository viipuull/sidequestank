import { useState } from "react";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  QUEST_CATEGORIES, QUEST_DIFFICULTIES, QUEST_TYPES, OBJECTIVE_TYPES,
  type QuestCategory, type QuestDifficulty, type QuestType, type QuestVisibility,
  type ObjectiveType, slugify,
} from "@/lib/quests.types";

export type QuestFormValues = {
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  cover_image_url: string;
  gallery_urls: string[];
  category: QuestCategory;
  quest_type: QuestType;
  difficulty: QuestDifficulty;
  estimated_minutes: number;
  address: string;
  latitude: string;
  longitude: string;
  city: string;
  reward_preview: string;
  reward_xp: number;
  tags: string[];
  visibility: QuestVisibility;
  featured: boolean;
  objectives: {
    id?: string;
    title: string;
    description: string;
    objective_type: ObjectiveType;
    completion_order: number;
    required: boolean;
    config: Record<string, unknown>;
  }[];
};

export const emptyForm: QuestFormValues = {
  title: "",
  slug: "",
  short_description: "",
  full_description: "",
  cover_image_url: "",
  gallery_urls: [],
  category: "exploration",
  quest_type: "walking",
  difficulty: "easy",
  estimated_minutes: 30,
  address: "",
  latitude: "",
  longitude: "",
  city: "Ankleshwar",
  reward_preview: "",
  reward_xp: 100,
  tags: [],
  visibility: "public",
  featured: false,
  objectives: [],
};

type Props = {
  value: QuestFormValues;
  onChange: (v: QuestFormValues) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
  extra?: React.ReactNode;
};

export function QuestForm({ value, onChange, onSubmit, submitting, submitLabel = "Save", extra }: Props) {
  const [tagInput, setTagInput] = useState("");

  function patch(p: Partial<QuestFormValues>) {
    onChange({ ...value, ...p });
  }

  function addObjective() {
    patch({
      objectives: [
        ...value.objectives,
        {
          title: "",
          description: "",
          objective_type: "visit_location",
          completion_order: value.objectives.length,
          required: true,
          config: {},
        },
      ],
    });
  }

  function updateObjective(i: number, p: Partial<QuestFormValues["objectives"][number]>) {
    const next = value.objectives.slice();
    next[i] = { ...next[i], ...p };
    patch({ objectives: next });
  }

  function removeObjective(i: number) {
    patch({ objectives: value.objectives.filter((_, idx) => idx !== i) });
  }

  function moveObjective(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.objectives.length) return;
    const next = value.objectives.slice();
    [next[i], next[j]] = [next[j], next[i]];
    patch({ objectives: next.map((o, idx) => ({ ...o, completion_order: idx })) });
  }

  function updateObjectiveConfig(i: number, cfg: Record<string, unknown>) {
    updateObjective(i, { config: { ...value.objectives[i].config, ...cfg } });
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!t) return;
    if (value.tags.includes(t)) return;
    patch({ tags: [...value.tags, t].slice(0, 12) });
    setTagInput("");
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="space-y-5"
    >
      <Section title="Basics">
        <Field label="Title *">
          <Input
            value={value.title}
            onChange={(e) => {
              const title = e.target.value;
              patch({ title, slug: value.slug || slugify(title) });
            }}
            maxLength={160}
            required
          />
        </Field>
        <Field label="Slug (URL)">
          <Input value={value.slug} onChange={(e) => patch({ slug: slugify(e.target.value) })} maxLength={120} />
        </Field>
        <Field label="Short description">
          <Input value={value.short_description} onChange={(e) => patch({ short_description: e.target.value })} maxLength={240} />
        </Field>
        <Field label="Full description">
          <Textarea value={value.full_description} onChange={(e) => patch({ full_description: e.target.value })} rows={6} maxLength={8000} />
        </Field>
      </Section>

      <Section title="Media">
        <Field label="Cover image URL">
          <Input
            type="url"
            value={value.cover_image_url}
            onChange={(e) => patch({ cover_image_url: e.target.value })}
            placeholder="https://…"
          />
        </Field>
        {value.cover_image_url && (
          <img
            src={value.cover_image_url}
            alt="Cover preview"
            className="h-40 w-full rounded-2xl object-cover"
            onError={(e) => ((e.currentTarget.style.display = "none"))}
          />
        )}
      </Section>

      <Section title="Classification">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={value.category} onValueChange={(v) => patch({ category: v as QuestCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUEST_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Quest type">
            <Select value={value.quest_type} onValueChange={(v) => patch({ quest_type: v as QuestType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUEST_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Difficulty">
            <Select value={value.difficulty} onValueChange={(v) => patch({ difficulty: v as QuestDifficulty })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUEST_DIFFICULTIES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estimated minutes">
            <Input type="number" min={1} max={1440} value={value.estimated_minutes}
              onChange={(e) => patch({ estimated_minutes: Number(e.target.value) || 0 })} />
          </Field>
        </div>
      </Section>

      <Section title="Location">
        <Field label="City">
          <Input value={value.city} onChange={(e) => patch({ city: e.target.value })} />
        </Field>
        <Field label="Address">
          <Input value={value.address} onChange={(e) => patch({ address: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">
            <Input value={value.latitude} onChange={(e) => patch({ latitude: e.target.value })} placeholder="21.6266" />
          </Field>
          <Field label="Longitude">
            <Input value={value.longitude} onChange={(e) => patch({ longitude: e.target.value })} placeholder="73.0021" />
          </Field>
        </div>
      </Section>

      <Section title="Reward">
        <Field label="Reward preview">
          <Input value={value.reward_preview} onChange={(e) => patch({ reward_preview: e.target.value })} />
        </Field>
        <Field label="XP reward">
          <Input type="number" min={0} value={value.reward_xp}
            onChange={(e) => patch({ reward_xp: Number(e.target.value) || 0 })} />
        </Field>
        <p className="text-[11px] text-muted-foreground">
          Players earn <span className="font-semibold text-primary">+{Math.max(0, value.reward_xp)} XP</span> on completion.
          Suggested: 25 (quick), 75 (short), 150 (medium), 500 (epic).
        </p>
      </Section>

      <Section title="Tags">
        <div className="flex flex-wrap gap-1.5">
          {value.tags.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => patch({ tags: value.tags.filter((x) => x !== t) })}
              className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] text-primary"
            >
              #{t} ✕
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="Add tag" />
          <Button type="button" variant="outline" onClick={addTag}>Add</Button>
        </div>
      </Section>

      <Section title="Objectives">
        <div className="space-y-3">
          {value.objectives.map((o, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-background/40 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                <div className="flex-1" />
                <Button type="button" size="icon" variant="ghost" onClick={() => moveObjective(i, -1)} disabled={i === 0}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => moveObjective(i, 1)} disabled={i === value.objectives.length - 1}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => removeObjective(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <Input placeholder="Objective title" value={o.title}
                onChange={(e) => updateObjective(i, { title: e.target.value })} />
              <Textarea rows={2} placeholder="Description / hint"
                value={o.description}
                onChange={(e) => updateObjective(i, { description: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={o.objective_type} onValueChange={(v) => updateObjective(i, { objective_type: v as ObjectiveType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OBJECTIVE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between rounded-md border border-input bg-background px-3">
                  <Label className="text-xs">Required</Label>
                  <Switch checked={o.required} onCheckedChange={(c) => updateObjective(i, { required: c })} />
                </div>
              </div>
              <ObjectiveConfigEditor
                type={o.objective_type}
                config={o.config ?? {}}
                onChange={(cfg) => updateObjectiveConfig(i, cfg)}
              />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addObjective} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add objective
          </Button>
        </div>
      </Section>

      <Section title="Visibility">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Visibility">
            <Select value={value.visibility} onValueChange={(v) => patch({ visibility: v as QuestVisibility })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-end justify-between rounded-md border border-input bg-background px-3 py-2">
            <Label>Featured</Label>
            <Switch checked={value.featured} onCheckedChange={(c) => patch({ featured: c })} />
          </div>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-5 border-t border-border/60 bg-background/90 px-5 py-3 backdrop-blur"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)` }}>
        <div className="flex items-center gap-2">
          {extra}
          <Button type="submit" disabled={submitting} className="flex-1 h-11 rounded-2xl font-semibold">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl border border-border/60 bg-card/60 p-4 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ObjectiveConfigEditor({
  type, config, onChange,
}: { type: ObjectiveType; config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  if (type === "gps_checkin" || type === "visit_location") {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-2.5 space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">GPS target</div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Latitude" value={String(config.latitude ?? "")}
            onChange={(e) => onChange({ latitude: e.target.value ? Number(e.target.value) : undefined })} />
          <Input placeholder="Longitude" value={String(config.longitude ?? "")}
            onChange={(e) => onChange({ longitude: e.target.value ? Number(e.target.value) : undefined })} />
          <Input placeholder="Radius (m)" value={String(config.radius_m ?? 60)}
            onChange={(e) => onChange({ radius_m: Number(e.target.value) || 60 })} />
          <Input placeholder="Min accuracy (m)" value={String(config.min_accuracy_m ?? 200)}
            onChange={(e) => onChange({ min_accuracy_m: Number(e.target.value) || 200 })} />
        </div>
        <p className="text-[10px] text-muted-foreground">Leave lat/lng blank to accept any location (manual visit).</p>
      </div>
    );
  }
  if (type === "scan_qr") {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-2.5 space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">QR code</div>
        <Input placeholder="Expected QR payload (leave blank to accept any)" value={String(config.code ?? "")}
          onChange={(e) => onChange({ code: e.target.value })} />
      </div>
    );
  }
  if (type === "answer_trivia") {
    const choices = Array.isArray(config.choices) ? (config.choices as string[]) : ["", ""];
    const correct = Number(config.correct_index ?? 0);
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-2.5 space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Trivia</div>
        <Input placeholder="Question" value={String(config.question ?? "")}
          onChange={(e) => onChange({ question: e.target.value })} />
        {choices.map((c, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button type="button"
              onClick={() => onChange({ correct_index: idx })}
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${
                correct === idx ? "border-primary bg-primary text-primary-foreground" : "border-border"
              }`}
            >{String.fromCharCode(65 + idx)}</button>
            <Input value={c} placeholder={`Choice ${idx + 1}`}
              onChange={(e) => {
                const next = choices.slice(); next[idx] = e.target.value;
                onChange({ choices: next });
              }} />
            {choices.length > 2 && (
              <Button type="button" size="icon" variant="ghost" onClick={() => {
                const next = choices.filter((_, i2) => i2 !== idx);
                onChange({ choices: next, correct_index: Math.min(correct, next.length - 1) });
              }}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        {choices.length < 6 && (
          <Button type="button" size="sm" variant="outline" onClick={() => onChange({ choices: [...choices, ""] })}>
            <Plus className="mr-1 h-3 w-3" /> Add choice
          </Button>
        )}
        <Input placeholder="Explanation (optional)" value={String(config.explanation ?? "")}
          onChange={(e) => onChange({ explanation: e.target.value })} />
        <p className="text-[10px] text-muted-foreground">Tap A/B/C… to mark the correct answer.</p>
      </div>
    );
  }
  if (type === "take_photo") {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-2.5 space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Photo</div>
        <Input placeholder="Prompt (what to capture)" value={String(config.prompt ?? "")}
          onChange={(e) => onChange({ prompt: e.target.value })} />
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Photo source</Label>
          <Select
            value={String(config.photo_source ?? "both")}
            onValueChange={(v) => onChange({ photo_source: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="camera">Camera only</SelectItem>
              <SelectItem value="gallery">Gallery only</SelectItem>
              <SelectItem value="both">Camera + Gallery</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" min={1} max={10} placeholder="Max photos" value={String(config.max_photos ?? 1)}
            onChange={(e) => onChange({ max_photos: Number(e.target.value) || 1 })} />
          <Input type="number" min={0} max={10} placeholder="Retry limit" value={String(config.retry_limit ?? 3)}
            onChange={(e) => onChange({ retry_limit: Number(e.target.value) || 3 })} />
        </div>
        <Input placeholder="Hint (optional)" value={String(config.hint ?? "")}
          onChange={(e) => onChange({ hint: e.target.value })} />
      </div>
    );
  }
  return null;
}