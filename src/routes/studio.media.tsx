import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Copy, Loader2, Trash2, Upload, Search, Image as ImageIcon, LayoutGrid, List, RefreshCw, ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  founderDeleteMedia, founderListMedia, founderMediaUsage,
  founderReplaceMedia, founderSaveMediaMetadata, type MediaAsset,
} from "@/lib/media.functions";
import { formatBytes, uploadMediaFile, validateMediaFile } from "@/lib/media/upload";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/studio/media")({
  component: MediaLibraryPage,
});

function MediaLibraryPage() {
  const list = useServerFn(founderListMedia);
  const save = useServerFn(founderSaveMediaMetadata);
  const del = useServerFn(founderDeleteMedia);
  const usage = useServerFn(founderMediaUsage);
  const replace = useServerFn(founderReplaceMedia);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "image" | "video" | "other">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const replaceRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(0);

  const listQ = useQuery({
    queryKey: ["media", search, type],
    queryFn: () => list({ data: { search: search || undefined, type, limit: 300 } }),
  });

  const usageQ = useQuery({
    queryKey: ["media-usage", selected?.url],
    enabled: !!selected,
    queryFn: () => usage({ data: { url: selected!.url } }),
  });

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      const rows: MediaAsset[] = [];
      for (const file of files) {
        const err = validateMediaFile(file);
        if (err) {
          toast.error(`${file.name}: ${err}`);
          continue;
        }
        setUploading((n) => n + 1);
        try {
          const uploaded = await uploadMediaFile(file);
          const saved = await save({ data: uploaded });
          if (saved) rows.push(saved);
        } catch (e) {
          toast.error(`${file.name}: ${e instanceof Error ? e.message : "Upload failed"}`);
        } finally {
          setUploading((n) => Math.max(0, n - 1));
        }
      }
      return rows;
    },
    onSuccess: (rows) => {
      qc.invalidateQueries({ queryKey: ["media"] });
      if (rows.length) toast.success(`Uploaded ${rows.length}`);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async ({ id, force }: { id: string; force?: boolean }) =>
      del({ data: { id, force: !!force } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Deleted");
      setSelected(null);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Delete failed";
      if (msg.startsWith("REFERENCED:")) {
        const n = msg.split(":")[1];
        toast.error(`Referenced by ${n} item(s). Open details to force delete.`);
      } else toast.error(msg);
    },
  });

  const replaceMut = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const err = validateMediaFile(file);
      if (err) throw new Error(err);
      const uploaded = await uploadMediaFile(file);
      return replace({ data: { id, ...uploaded } });
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["media"] });
      if (row) setSelected(row);
      toast.success("Replaced");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Replace failed"),
  });

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    uploadMut.mutate(Array.from(files));
  }

  const items = useMemo(() => listQ.data ?? [], [listQ.data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Content</div>
          <h1 className="text-2xl font-semibold">Media Library</h1>
          <p className="text-sm text-muted-foreground">Upload once, reuse everywhere across quests, collections, and events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
            {uploading > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { handleFiles(e.target.files); if (fileRef.current) fileRef.current.value = ""; }} />
        </div>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search filename…" className="pl-9" />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="all">All types</option>
            <option value="image">Images</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </select>
          <Button size="icon" variant={view === "grid" ? "default" : "outline"} onClick={() => setView("grid")} aria-label="Grid view">
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button size="icon" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")} aria-label="List view">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div
        className={`relative rounded-2xl border border-border/60 bg-card p-3 min-h-[320px] ${dragOver ? "ring-2 ring-primary" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        {listQ.isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center py-16 text-center text-sm text-muted-foreground">
            <ImageIcon className="mb-2 h-10 w-10 opacity-40" />
            <p>No media yet. Drag & drop images anywhere here.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((a) => (
              <button key={a.id} type="button" onClick={() => setSelected(a)}
                className="group overflow-hidden rounded-xl border border-border bg-background text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
                <div className="aspect-square w-full bg-muted">
                  {a.mime_type.startsWith("image/") ? (
                    <img src={a.url} alt={a.filename} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">{a.mime_type}</div>
                  )}
                </div>
                <div className="p-2 text-[11px]">
                  <div className="truncate font-medium">{a.filename}</div>
                  <div className="text-muted-foreground">{formatBytes(a.size_bytes)}{a.width && a.height ? ` · ${a.width}×${a.height}` : ""}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border">
            {items.map((a) => (
              <button key={a.id} type="button" onClick={() => setSelected(a)}
                className="flex w-full items-center gap-3 p-2 text-left hover:bg-muted">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {a.mime_type.startsWith("image/") && <img src={a.url} alt={a.filename} loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{a.filename}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {a.mime_type} · {formatBytes(a.size_bytes)}{a.width && a.height ? ` · ${a.width}×${a.height}` : ""}
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
              </button>
            ))}
          </div>
        )}
        {dragOver && (
          <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-background/70 text-sm font-semibold text-primary">
            Drop files to upload
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">{selected?.filename}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-border bg-muted">
                {selected.mime_type.startsWith("image/") ? (
                  <img src={selected.url} alt={selected.filename} className="max-h-[380px] w-full object-contain" />
                ) : (
                  <div className="p-8 text-center text-muted-foreground">{selected.mime_type}</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Type" value={selected.mime_type} />
                <Detail label="Size" value={formatBytes(selected.size_bytes)} />
                <Detail label="Dimensions" value={selected.width && selected.height ? `${selected.width}×${selected.height}` : "—"} />
                <Detail label="Uploaded" value={formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })} />
              </div>
              <div className="flex items-center gap-2">
                <Input readOnly value={selected.url} onFocus={(e) => e.currentTarget.select()} />
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(selected.url); toast.success("URL copied"); }} aria-label="Copy URL">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" asChild aria-label="Open in new tab">
                  <a href={selected.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                </Button>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Used in</div>
                {usageQ.isLoading ? (
                  <div className="text-xs text-muted-foreground">Checking references…</div>
                ) : (usageQ.data ?? []).length === 0 ? (
                  <div className="text-xs text-muted-foreground">Not referenced by any content.</div>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {(usageQ.data ?? []).map((r, i) => (
                      <li key={i} className="flex items-center justify-between rounded-md border border-border/60 p-2">
                        <span><span className="uppercase tracking-wide text-muted-foreground">{r.kind}</span> · {r.label}</span>
                        <span className="text-muted-foreground">{r.field}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => replaceRef.current?.click()} disabled={replaceMut.isPending}>
                  {replaceMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Replace
                </Button>
                <input ref={replaceRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && selected) replaceMut.mutate({ id: selected.id, file: f });
                    if (replaceRef.current) replaceRef.current.value = "";
                  }} />
                <Button
                  variant="destructive"
                  onClick={() => {
                    const refs = usageQ.data?.length ?? 0;
                    if (refs > 0) {
                      if (!confirm(`This file is used by ${refs} item(s). Delete anyway?`)) return;
                      deleteMut.mutate({ id: selected.id, force: true });
                    } else {
                      if (!confirm("Delete this file? This cannot be undone.")) return;
                      deleteMut.mutate({ id: selected.id });
                    }
                  }}
                  disabled={deleteMut.isPending}
                >
                  {deleteMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="truncate">{value}</div>
    </div>
  );
}