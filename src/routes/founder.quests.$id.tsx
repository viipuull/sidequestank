import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { QuestForm, emptyForm, type QuestFormValues } from "@/components/quests/QuestForm";
import { Button } from "@/components/ui/button";
import { getQuestForEdit, updateQuest, setQuestStatus } from "@/lib/quests.functions";
import { toPayload } from "./founder.quests.new";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";

export const Route = createFileRoute("/founder/quests/$id")({
  head: () => ({ meta: [{ title: "Edit Quest — SideQuest" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (<AuthGate><EditQuestPage /></AuthGate>),
});

function EditQuestPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL;
  useEffect(() => { if (!loading && !isFounder) navigate({ to: "/home" }); }, [loading, isFounder, navigate]);

  const fetch = useServerFn(getQuestForEdit);
  const update = useServerFn(updateQuest);
  const setStat = useServerFn(setQuestStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["studio-quest", id],
    enabled: isFounder,
    queryFn: () => fetch({ data: { id } }),
  });

  const initial = useMemo<QuestFormValues | null>(() => {
    if (!data) return null;
    return {
      ...emptyForm,
      title: data.title,
      slug: data.slug,
      short_description: data.short_description ?? "",
      full_description: data.full_description ?? "",
      cover_image_url: data.cover_image_url ?? "",
      gallery_urls: data.gallery_urls ?? [],
      category: data.category,
      quest_type: data.quest_type,
      difficulty: data.difficulty,
      estimated_minutes: data.estimated_minutes,
      address: data.address ?? "",
      latitude: data.latitude != null ? String(data.latitude) : "",
      longitude: data.longitude != null ? String(data.longitude) : "",
      city: data.city,
      reward_preview: data.reward_preview ?? "",
      reward_xp: data.reward_xp,
      tags: data.tags ?? [],
      visibility: data.visibility,
      featured: data.featured,
      repeatable: (data as { repeatable?: boolean }).repeatable ?? false,
      objectives: (data.objectives ?? []).map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description ?? "",
        objective_type: o.objective_type,
        completion_order: o.completion_order,
        required: o.required,
        config: (o.config ?? {}) as Record<string, unknown>,
      })),
    };
  }, [data]);

  const [values, setValues] = useState<QuestFormValues | null>(null);
  useEffect(() => { if (initial && !values) setValues(initial); }, [initial, values]);

  const [submitting, setSubmitting] = useState(false);

  async function save() {
    if (!values) return;
    setSubmitting(true);
    try {
      await update({ data: { id, payload: toPayload(values) } });
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["studio-quests"] });
      qc.invalidateQueries({ queryKey: ["studio-quest", id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally { setSubmitting(false); }
  }

  async function togglePublish() {
    if (!data) return;
    const next = data.status === "published" ? "draft" : "published";
    await setStat({ data: { id, status: next as never } });
    toast.success(next === "published" ? "Published" : "Unpublished");
    qc.invalidateQueries({ queryKey: ["studio-quest", id] });
    qc.invalidateQueries({ queryKey: ["studio-quests"] });
  }

  if (!isFounder || isLoading || !values || !data) {
    return <div className="grid min-h-[100dvh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2 px-5 py-3">
          <Link to="/founder/quests" className="grid h-9 w-9 place-items-center rounded-full border border-border/60"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Editing · {data.status}</div>
            <h1 className="truncate text-base font-bold">{data.title}</h1>
          </div>
          {data.status === "published" && (
            <Link to="/quests/$slug" params={{ slug: data.slug }} className="grid h-9 w-9 place-items-center rounded-full border border-border/60" aria-label="Preview">
              <Eye className="h-4 w-4" />
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-md px-5 py-4">
        <QuestForm
          value={values}
          onChange={setValues}
          onSubmit={save}
          submitting={submitting}
          submitLabel="Save changes"
          extra={
            <Button type="button" variant="outline" onClick={togglePublish} className="h-11 rounded-2xl">
              {data.status === "published" ? "Unpublish" : "Publish"}
            </Button>
          }
        />
      </main>
    </div>
  );
}