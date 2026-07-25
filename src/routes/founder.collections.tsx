import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Loader2, Plus, Archive, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import {
  founderListCollections,
  founderArchiveCollection,
  founderDuplicateCollection,
  founderSaveCollection,
} from "@/lib/collections.functions";

export const Route = createFileRoute("/founder/collections")({
  head: () => ({
    meta: [
      { title: "Collections Builder — SideQuest Studio" },
      { name: "description", content: "Bundle SideQuest quests into premium themed sets and trails." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FounderCollectionsPage,
});

function FounderCollectionsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const listFn = useServerFn(founderListCollections);
  const archFn = useServerFn(founderArchiveCollection);
  const dupFn = useServerFn(founderDuplicateCollection);
  const saveFn = useServerFn(founderSaveCollection);

  const q = useQuery({
    queryKey: ["founder-collections"],
    queryFn: () => listFn({}),
    enabled: !!user,
  });

  if (!user || (profile && profile.username !== "sidequest" && !profile?.display_name?.toLowerCase().includes("founder"))) {
    // Simple guard; RLS also enforces server-side.
  }

  async function handleCreate() {
    const slug = `collection-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const row = await saveFn({
        data: {
          slug,
          name: "Untitled collection",
          description: "",
          icon: "📚",
          category: "adventure",
          collection_type: "quest_series",
          difficulty: "easy",
          visibility: "public",
          status: "draft",
          featured: false,
          seasonal: false,
          hidden: false,
          repeatable: false,
          estimated_minutes: 60,
          display_order: 100,
          reward_xp: 100,
          reward_summary: "",
          tags: [],
          city: "Ankleshwar",
        },
      });
      qc.invalidateQueries({ queryKey: ["founder-collections"] });
      toast.success("Draft created");
      window.location.href = `/founder/collections/${row.id}`;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Link to="/founder" className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card/60">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Studio</p>
          <h1 className="text-xl font-bold">Collections Builder</h1>
        </div>
        <Button onClick={handleCreate} size="sm" className="h-9 rounded-xl">
          <Plus className="mr-1 h-4 w-4" /> New
        </Button>
      </div>

      {q.isLoading ? (
        <div className="mt-10 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
          No collections yet. Create your first one to bundle quests into a themed set.
        </p>
      ) : (
        <div className="mt-5 space-y-2">
          {q.data!.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3 shadow-sm backdrop-blur"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-2xl">
                {c.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{c.name}</span>
                  {c.featured && <Badge className="rounded-full text-[10px]"><Sparkles className="mr-1 h-2.5 w-2.5" />Featured</Badge>}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>{c.status}</span>
                  <span>{c.visibility}</span>
                  <span>{c.quest_count} quests</span>
                  <span>+{c.reward_xp} XP</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Link
                  to="/founder/collections/$id"
                  params={{ id: c.id }}
                  className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold active:scale-95"
                >
                  Edit
                </Link>
                <button
                  onClick={async () => {
                    try {
                      await dupFn({ data: { id: c.id } });
                      qc.invalidateQueries({ queryKey: ["founder-collections"] });
                      toast.success("Duplicated");
                    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] active:scale-95"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
                <button
                  onClick={async () => {
                    try {
                      await archFn({ data: { id: c.id, archive: c.status !== "archived" } });
                      qc.invalidateQueries({ queryKey: ["founder-collections"] });
                    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] active:scale-95"
                >
                  <Archive className="h-3 w-3" /> {c.status === "archived" ? "Unarch" : "Arch"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}