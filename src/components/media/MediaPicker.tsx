import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, Upload, Image as ImageIcon, X, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  founderListMedia,
  founderSaveMediaMetadata,
  type MediaAsset,
} from "@/lib/media.functions";
import { formatBytes, uploadMediaFile, validateMediaFile } from "@/lib/media/upload";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (asset: MediaAsset) => void;
  accept?: string;
};

export function MediaPicker({ open, onOpenChange, onSelect, accept = "image/*" }: Props) {
  const list = useServerFn(founderListMedia);
  const save = useServerFn(founderSaveMediaMetadata);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "image" | "video" | "other">("image");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState<number>(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const listQ = useQuery({
    queryKey: ["media", search, type],
    enabled: open,
    queryFn: () => list({ data: { search: search || undefined, type, limit: 200 } }),
  });

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      const results: MediaAsset[] = [];
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
          if (saved) results.push(saved);
        } catch (e) {
          toast.error(`${file.name}: ${e instanceof Error ? e.message : "Upload failed"}`);
        } finally {
          setUploading((n) => Math.max(0, n - 1));
        }
      }
      return results;
    },
    onSuccess: (rows) => {
      qc.invalidateQueries({ queryKey: ["media"] });
      if (rows.length) toast.success(`Uploaded ${rows.length} file${rows.length === 1 ? "" : "s"}`);
    },
  });

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    uploadMut.mutate(Array.from(files));
  }

  const items = useMemo(() => listQ.data ?? [], [listQ.data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Media Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b p-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename…"
              className="pl-9"
              aria-label="Search media"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            aria-label="Filter by type"
          >
            <option value="all">All</option>
            <option value="image">Images</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </select>
          <Button
            type="button"
            size="icon"
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
            {uploading > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
        </div>

        <div
          className={`relative max-h-[60vh] min-h-[280px] overflow-y-auto p-4 ${dragOver ? "bg-primary/5 ring-2 ring-primary ring-inset" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          {listQ.isLoading ? (
            <div className="grid place-items-center py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="grid place-items-center py-16 text-center text-sm text-muted-foreground">
              <ImageIcon className="mb-2 h-10 w-10 opacity-40" />
              <p>No media yet. Drag & drop or click Upload.</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onSelect(a);
                    onOpenChange(false);
                  }}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label={`Select ${a.filename}`}
                >
                  <div className="aspect-square w-full bg-muted">
                    {a.mime_type.startsWith("image/") ? (
                      <img src={a.url} alt={a.filename} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                        {a.mime_type}
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-[11px]">
                    <div className="truncate font-medium">{a.filename}</div>
                    <div className="text-muted-foreground">
                      {formatBytes(a.size_bytes)}
                      {a.width && a.height ? ` · ${a.width}×${a.height}` : ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {items.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onSelect(a);
                    onOpenChange(false);
                  }}
                  className="flex w-full items-center gap-3 p-2 text-left hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {a.mime_type.startsWith("image/") ? (
                      <img src={a.url} alt={a.filename} className="h-full w-full object-cover" loading="lazy" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.filename}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {a.mime_type} · {formatBytes(a.size_bytes)}
                      {a.width && a.height ? ` · ${a.width}×${a.height}` : ""}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}

          {dragOver && (
            <div className="pointer-events-none absolute inset-4 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-background/70 text-sm font-semibold text-primary">
              Drop files to upload
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MediaField({
  label,
  value,
  onChange,
  placeholder = "https://…",
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs">{label}</label>}
      <div className="flex gap-2">
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          <ImageIcon className="mr-1 h-4 w-4" /> Browse
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")} aria-label="Clear">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {value && (
        <img
          src={value}
          alt="Preview"
          className="mt-2 h-32 w-full rounded-xl object-cover"
          onError={(e) => ((e.currentTarget.style.display = "none"))}
        />
      )}
      <MediaPicker open={open} onOpenChange={setOpen} onSelect={(a) => onChange(a.url)} />
    </div>
  );
}