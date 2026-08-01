import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-md bg-muted/40", className)} />;
}

export function QuestCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
      <Bar className="h-40 rounded-none" />
      <div className="space-y-2 p-4">
        <Bar className="h-4 w-3/5" />
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-4/5" />
        <div className="flex gap-3 pt-2">
          <Bar className="h-3 w-16" />
          <Bar className="h-3 w-12" />
          <Bar className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

export function QuestGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Loading quests">
      {Array.from({ length: count }).map((_, i) => (
        <QuestCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-3">
      <Bar className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Bar className="h-3 w-2/5" />
        <Bar className="h-2.5 w-1/4" />
      </div>
      <Bar className="h-3 w-10" />
    </div>
  );
}

export function ListSkeleton({ count = 6, label = "Loading" }: { count?: number; label?: string }) {
  return (
    <div className="space-y-2" role="status" aria-busy="true" aria-label={label}>
      {Array.from({ length: count }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatTilesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3" role="status" aria-busy="true" aria-label="Loading stats">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card/50 p-3">
          <Bar className="h-6 w-12" />
          <Bar className="mt-2 h-2.5 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/50 p-5" role="status" aria-busy="true">
      <div className="flex items-center gap-4">
        <Bar className="h-16 w-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Bar className="h-4 w-1/2" />
          <Bar className="h-3 w-1/3" />
        </div>
      </div>
      <Bar className="mt-5 h-2 w-full rounded-full" />
    </div>
  );
}