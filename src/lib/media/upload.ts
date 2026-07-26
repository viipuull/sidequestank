import { supabase } from "@/integrations/supabase/client";

const BUCKET = "quest-media";
export const LIBRARY_PREFIX = "library";
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB
export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
];

export type UploadedMedia = {
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
};

export function validateMediaFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return `File too large (max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB)`;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return `Unsupported type: ${file.type || "unknown"}`;
  return null;
}

function slugFile(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";
  const ext = (dot > 0 ? name.slice(dot + 1) : "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  return `${base}.${ext}`;
}

async function readImageDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  if (!file.type.startsWith("image/")) return { width: null, height: null };
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export async function uploadMediaFile(file: File, opts?: { pathPrefix?: string }): Promise<UploadedMedia> {
  const err = validateMediaFile(file);
  if (err) throw new Error(err);
  const filename = slugFile(file.name);
  const path = `${opts?.pathPrefix ?? LIBRARY_PREFIX}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${filename}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const dims = await readImageDimensions(file);
  return {
    storage_path: path,
    filename: file.name.slice(0, 200),
    mime_type: file.type,
    size_bytes: file.size,
    width: dims.width,
    height: dims.height,
  };
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}