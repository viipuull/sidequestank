import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { listAuditEvents, type AuditRow } from "@/lib/studio/index.functions";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/studio/audit")({
  component: AuditPage,
});

function AuditPage() {
  const fetchAudit = useServerFn(listAuditEvents);
  const { data, isLoading } = useQuery<AuditRow[]>({
    queryKey: ["studio-audit", 100],
    queryFn: () => fetchAudit({ data: { limit: 100 } }),
  });
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Audit</div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Every Studio action is recorded here.</p>
      </div>
      <Card className="p-0 border-border/60 overflow-hidden">
        {isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">No audit events yet.</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {data.map((a) => (
              <li key={a.id} className="p-4 flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm"><span className="font-medium">{a.action}</span>{" "}<span className="text-muted-foreground">on {a.target_kind}</span></div>
                  <div className="text-xs text-muted-foreground truncate">{a.actor_email ?? "system"} · {a.summary ?? "—"}</div>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}