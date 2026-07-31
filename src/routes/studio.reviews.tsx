import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/studio/AdminShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { toast } from "sonner";
import { Check, X, Camera, ExternalLink } from "lucide-react";
import {
  listPhotoReviews,
  approvePhotoSubmission,
  rejectPhotoSubmission,
} from "@/lib/reviews.functions";

export const Route = createFileRoute("/studio/reviews")({
  head: () => ({ meta: [{ title: "Photo Reviews — Studio" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AuthGate>
      <AdminShell>
        <ReviewsPage />
      </AdminShell>
    </AuthGate>
  ),
});

type Tab = "pending_review" | "completed" | "pending";

function ReviewsPage() {
  const [tab, setTab] = useState<Tab>("pending_review");
  const listFn = useServerFn(listPhotoReviews);
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["photo-reviews", tab],
    queryFn: () => listFn({ data: { status: tab, limit: 100 } }),
    retry: 1,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Photo Reviews</h1>
        <p className="text-sm text-muted-foreground">Approve or reject player photo submissions.</p>
      </header>

      <div className="flex gap-2 border-b border-border/60">
        {(
          [
            { id: "pending_review" as const, label: "Pending" },
            { id: "completed" as const, label: "Approved" },
            { id: "pending" as const, label: "Rejected" },
          ]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingScreen />
      ) : isError ? (
        <ErrorState
          title="Couldn't load submissions"
          description={error instanceof Error ? error.message : "The review queue failed to load."}
          onRetry={() => void refetch()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Camera} title="No submissions" description={tab === "pending_review" ? "You're all caught up." : "Nothing here yet."} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((r) => (
            <ReviewCard
              key={r.id}
              row={r}
              readOnly={tab !== "pending_review"}
              onDone={() => {
                qc.invalidateQueries({ queryKey: ["photo-reviews"] });
                qc.invalidateQueries({ queryKey: ["pending-review-count"] });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type ReviewRow = Awaited<ReturnType<typeof listPhotoReviews>>[number];

function ReviewCard({ row, readOnly, onDone }: { row: ReviewRow; readOnly: boolean; onDone: () => void }) {
  const approveFn = useServerFn(approvePhotoSubmission);
  const rejectFn = useServerFn(rejectPhotoSubmission);
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const approve = useMutation({
    mutationFn: () => approveFn({ data: { progressId: row.id } }),
    onSuccess: () => { toast.success("Approved"); onDone(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const reject = useMutation({
    mutationFn: () => rejectFn({ data: { progressId: row.id, reason: reason.trim() } }),
    onSuccess: () => { toast.success("Rejected"); setShowReject(false); setReason(""); onDone(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      {row.photoUrl ? (
        <a href={row.photoUrl} target="_blank" rel="noreferrer" className="block group relative">
          <img src={row.photoUrl} alt="Submission" className="w-full aspect-[4/3] object-cover" />
          <div className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition">
            <ExternalLink className="h-3.5 w-3.5 text-white" />
          </div>
        </a>
      ) : (
        <div className="w-full aspect-[4/3] grid place-items-center bg-muted text-muted-foreground text-xs">No photo</div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">{row.quest.title}</div>
            <div className="font-semibold text-sm">{row.objective.title}</div>
          </div>
          <Badge variant="outline" className="text-[10px]">{row.attempts} try{row.attempts === 1 ? "" : "s"}</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{row.player.display_name}</span>
          <span>·</span>
          <span>@{row.player.username}</span>
          <span className="ml-auto">{new Date(row.submittedAt).toLocaleString()}</span>
        </div>
        {row.reviewNotes && (
          <div className="text-xs rounded-md bg-muted/60 p-2 text-muted-foreground">
            <span className="font-semibold text-foreground">Note: </span>{row.reviewNotes}
          </div>
        )}
        {!readOnly && !showReject && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1" disabled={approve.isPending} onClick={() => approve.mutate()}>
              <Check className="h-4 w-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowReject(true)}>
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
          </div>
        )}
        {showReject && (
          <div className="space-y-2 pt-1">
            <Textarea
              placeholder="Reason (shown to player)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                disabled={reason.trim().length < 3 || reject.isPending}
                onClick={() => reject.mutate()}
              >
                Confirm reject
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowReject(false); setReason(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}