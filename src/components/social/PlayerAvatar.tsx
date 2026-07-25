export function PlayerAvatar({ url, name, size = 44 }: { url: string | null; name: string; size?: number }) {
  const initials = name.split(/\s+/).slice(0,2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "??";
  return (
    <div
      className="grid place-items-center rounded-full border border-border bg-gradient-to-br from-primary/25 to-accent/15 text-xs font-bold text-foreground overflow-hidden"
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
