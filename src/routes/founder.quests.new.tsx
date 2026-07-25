import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { QuestForm, emptyForm, type QuestFormValues } from "@/components/quests/QuestForm";
import { createQuest } from "@/lib/quests.functions";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";

export const Route = createFileRoute("/founder/quests/new")({
  head: () => ({ meta: [{ title: "New Quest — SideQuest" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (<AuthGate><NewQuestPage /></AuthGate>),
});

function NewQuestPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL;
  useEffect(() => { if (!loading && !isFounder) navigate({ to: "/home" }); }, [loading, isFounder, navigate]);

  const [values, setValues] = useState<QuestFormValues>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const create = useServerFn(createQuest);

  async function submit() {
    if (!values.title.trim()) { toast.error("Title required"); return; }
    setSubmitting(true);
    try {
      const payload = toPayload(values);
      const r = await create({ data: payload });
      toast.success("Quest created");
      qc.invalidateQueries({ queryKey: ["studio-quests"] });
      navigate({ to: "/founder/quests/$id", params: { id: r.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create quest");
    } finally { setSubmitting(false); }
  }

  if (!isFounder) return <div className="grid min-h-[100dvh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2 px-5 py-3">
          <Link to="/founder/quests" className="grid h-9 w-9 place-items-center rounded-full border border-border/60"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Founder Studio</div>
            <h1 className="text-base font-bold">New Quest</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-md px-5 py-4">
        <QuestForm value={values} onChange={setValues} onSubmit={submit} submitting={submitting} submitLabel="Create draft" />
      </main>
    </div>
  );
}

export function toPayload(v: QuestFormValues) {
  return {
    title: v.title.trim(),
    slug: v.slug.trim() || undefined,
    short_description: v.short_description,
    full_description: v.full_description,
    cover_image_url: v.cover_image_url.trim() ? v.cover_image_url.trim() : null,
    gallery_urls: v.gallery_urls,
    category: v.category,
    quest_type: v.quest_type,
    difficulty: v.difficulty,
    estimated_minutes: Number(v.estimated_minutes) || 30,
    address: v.address.trim() ? v.address.trim() : null,
    latitude: v.latitude.trim() ? Number(v.latitude) : null,
    longitude: v.longitude.trim() ? Number(v.longitude) : null,
    city: v.city.trim() || "Ankleshwar",
    reward_preview: v.reward_preview,
    reward_xp: Number(v.reward_xp) || 0,
    tags: v.tags,
    visibility: v.visibility,
    featured: v.featured,
    objectives: v.objectives.map((o, i) => ({
      title: o.title.trim(),
      description: o.description,
      objective_type: o.objective_type,
      completion_order: i,
      required: o.required,
    })).filter((o) => o.title.length > 0),
  };
}