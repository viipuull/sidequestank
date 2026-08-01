import { useMemo, useState } from "react";
import { Search, Star, Trash2 } from "lucide-react";
import {
  BUILT_IN_TEMPLATES, CATEGORY_META, PRIORITY_META, searchTemplates,
  type NotificationTemplate, type TemplateCategory,
} from "@/lib/push/templates";

type Props = {
  saved: NotificationTemplate[];
  onPick: (tpl: NotificationTemplate) => void;
  onToggleFavorite?: (tpl: NotificationTemplate) => void;
  onDelete?: (tpl: NotificationTemplate) => void;
};

export function TemplateLibrary({ saved, onPick, onToggleFavorite, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all" | "favorites">("all");

  const all = useMemo(() => [...saved, ...BUILT_IN_TEMPLATES], [saved]);
  const favorites = useMemo(
    () => new Set(saved.filter((s) => s.favorite).map((s) => s.slug)),
    [saved],
  );
  const results = useMemo(
    () => searchTemplates(all, query, category, favorites),
    [all, query, category, favorites],
  );

  const tabs: (TemplateCategory | "all" | "favorites")[] = [
    "all", "favorites", ...(Object.keys(CATEGORY_META) as TemplateCategory[]),
  ];

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Template library · {all.length}
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="w-56 rounded-xl border border-border bg-background py-1.5 pl-7 pr-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tabs.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 ${
              category === c ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
            }`}>
            {c === "all" ? "All" : c === "favorites" ? "★ Favorites" : `${CATEGORY_META[c].icon} ${CATEGORY_META[c].label}`}
          </button>
        ))}
      </div>

      <div className="mt-3 grid max-h-[22rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {results.length === 0 && <p className="text-sm text-muted-foreground">No templates match that search.</p>}
        {results.map((tpl) => {
          const meta = PRIORITY_META[tpl.priority];
          const isSaved = !tpl.built_in && !!tpl.id;
          return (
            <div key={`${tpl.id ?? "b"}-${tpl.slug}`}
              className={`group rounded-xl border ${meta.ring} bg-background/60 p-3 text-left transition hover:border-primary/50`}>
              <button onClick={() => onPick(tpl)} className="w-full text-left active:scale-[0.99]">
                <div className="flex items-center gap-2">
                  <span className="text-base">{tpl.icon}</span>
                  <p className="truncate text-sm font-semibold">{tpl.name}</p>
                  <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                </div>
                <p className="mt-1 truncate text-xs font-medium">{tpl.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{tpl.body}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_META[tpl.category].label}
                  {tpl.variations?.length ? ` · ${tpl.variations.length + 1} variations` : ""}
                  {isSaved ? " · saved" : ""}
                </p>
              </button>
              {isSaved && (
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={() => onToggleFavorite?.(tpl)}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${tpl.favorite ? "text-amber-400" : "text-muted-foreground"}`}>
                    <Star className="h-3.5 w-3.5" /> {tpl.favorite ? "Favorited" : "Favorite"}
                  </button>
                  <button onClick={() => onDelete?.(tpl)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}