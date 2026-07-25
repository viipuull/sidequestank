import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Loader2, Pencil, Plus, Trash2, Eye } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  listAllQuests, deleteQuest, duplicateQuest, setQuestStatus,
} from "@/lib/quests.functions";
import { QUEST_CATEGORIES } from "@/lib/quests.types";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";

export const Route = createFileRoute("/founder/quests/")({
  head: () => ({
    meta: [
      { title: "Quest Studio — SideQuest" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AuthGate>
      <StudioPage />
    </AuthGate>
  ),
});

function StudioPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL;
  useEffect(() => { if (!loading && !isFounder) navigate({ to: "/home" }); }, [loading, isFounder, navigate]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived" | undefined>(undefined);

  const qc = useQueryClient();
  const list = useServerFn(listAllQuests);
  const del = useServerFn(deleteQuest);
  const dup = useServerFn(duplicateQuest);
  const setStat = useServerFn(setQuestStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["studio-quests", { search, status }],
    enabled: isFounder,
    queryFn: () => list({ data: { search: search || undefined, status } }),
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this quest? This cannot be undone.")) return;
    await del({ data: { id } });
    toast.success("Quest deleted");
    qc.invalidateQueries({ queryKey: ["studio-quests"] });
  }
  async function handleDuplicate(id: string) {
    const r = await dup({ data: { id } });
    toast.success("Duplicated");
    qc.invalidateQueries({ queryKey: ["studio-quests"] });
    navigate({ to: "/founder/quests/$id", params: { id: r.id } });
  }
  async function handleTogglePublish(id: string, current: string) {
    const next = current === "published" ? "draft" : "published";
    await setStat({ data: { id, status: next as never } });
    toast.success(next === "published" ? "Published" : "Unpublished");
    qc.invalidateQueries({ queryKey: ["studio-quests"] });
  }

  if (!isFounder) {
    return <div className="grid min-h-[100dvh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="relative min-h-[100dvh] bg-background pb-24 text-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2 px-5 py-3">
          <Link to="/founder" className="grid h-9 w-9 place-items-center rounded-full border border-border/60">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Founder</div>
            <h1 className="text-base font-bold">Quest Studio</h1>
          </div>
          <Link to="/founder/quests/new" className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow">
            <Plus className="h-3.5 w-3.5" /> New
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-5 py-4">
        <Input placeholder="Search quests" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {([undefined, "draft", "published", "archived"] as const).map((s) => (
            <button
              key={String(s)}
              onClick={() => setStatus(s)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all active:scale-95 ${
                status === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-muted-foreground"
              }`}
            >
              {s ?? "All"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !data || data.length === 0 ? (
          <EmptyStudio />
        ) : (
          <ul className="space-y-2">
            {data.map((q) => {
              const cat = QUEST_CATEGORIES.find((c) => c.value === q.category);
              return (
                <motion.li
                  key={q.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/60 bg-card/60 p-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-lg">
                      {cat?.emoji ?? "🧭"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{q.title}</span>
                        <Badge variant={q.status === "published" ? "default" : "outline"} className="text-[9px]">
                          {q.status}
                        </Badge>
                        {q.featured && <Badge variant="secondary" className="text-[9px]">Featured</Badge>}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {q.difficulty} · {q.quest_type} · {q.visibility}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/founder/quests/$id" params={{ id: q.id }}>
                        <Pencil className="mr-1 h-3 w-3" /> Edit
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleTogglePublish(q.id, q.status)}>
                      <Eye className="mr-1 h-3 w-3" /> {q.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDuplicate(q.id)}>
                      <Copy className="mr-1 h-3 w-3" /> Duplicate
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(q.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function EmptyStudio() {
  return (
    <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-8 text-center">
      <h3 className="text-base font-semibold">No quests yet</h3>
      <p className="mt-1 text-xs text-muted-foreground">Craft your first quest and publish it to the feed.</p>
      <Link to="/founder/quests/new" className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
        <Plus className="h-3.5 w-3.5" /> Create Quest
      </Link>
    </div>
  );
}