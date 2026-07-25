export function RankBadge({ rank }: { rank: number }) {
  const styles =
    rank === 1
      ? "from-amber-300/40 to-amber-500/20 text-amber-200 border-amber-300/50"
      : rank === 2
      ? "from-slate-200/30 to-slate-400/20 text-slate-100 border-slate-200/40"
      : rank === 3
      ? "from-orange-400/30 to-orange-600/20 text-orange-200 border-orange-400/40"
      : "from-primary/20 to-accent/10 text-foreground border-border";
  return (
    <div className={`grid h-9 w-9 place-items-center rounded-full border bg-gradient-to-br ${styles} text-sm font-bold`}>
      {rank <= 999 ? rank : "999+"}
    </div>
  );
}
