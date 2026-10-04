import { supabase } from "@/integrations/supabase/client";

/**
 * StorageService: provider-agnostic file storage. The app only talks to this
 * interface; swap the provider for S3 / R2 / B2 later without touching UI.
 */
export interface StorageProvider {
  id: string;
  upload(path: string, file: Blob, contentType?: string): Promise<void>;
  signedUrl(path: string, expiresIn?: number): Promise<string>;
  remove(paths: string[]): Promise<void>;
  list(prefix: string): Promise<{ name: string; size: number; updated_at: string | null; mimetype?: string | undefined }[]>;
}

const BUCKET = "media";

export const cloudStorage: StorageProvider = {
  id: "lovable-cloud",
  async upload(path, file, contentType) {
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      ...((contentType || (file as File).type) ? { contentType: contentType || (file as File).type } : {}),
    });
    if (error) throw new Error("No se pudo subir el archivo");
  },
  async signedUrl(path, expiresIn = 3600) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
    if (error || !data) throw new Error("Archivo no encontrado");
    return data.signedUrl;
  },
  async remove(paths) {
    if (!paths.length) return;
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) throw new Error("No se pudo eliminar el archivo");
  },
  async list(prefix) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: 1000,
      sortBy: { column: "updated_at", order: "desc" },
    });
    if (error) throw new Error("No se pudo listar archivos");
    return (data ?? [])
      .filter((f) => f.id)
      .map((f) => ({
        name: f.name,
        size: (f.metadata as { size?: number } | null)?.size ?? 0,
        updated_at: f.updated_at,
        mimetype: (f.metadata as { mimetype?: string | undefined } | null)?.mimetype,
      }));
  },
};

export const storage: StorageProvider = cloudStorage;

export function safeName(name: string) {
  return name.normalize("NFD").replace(/[^\w.\-]+/g, "_");
}

/* ---------- OfflineService: Cache Storage for audio blobs ---------- */
const CACHE = "wcmp-offline-v1";
const offlineKey = (path: string) => `/offline/${path}`;

export const offline = {
  supported: () => typeof caches !== "undefined",
  async has(path: string) {
    if (!this.supported()) return false;
    const c = await caches.open(CACHE);
    return !!(await c.match(offlineKey(path)));
  },
  async save(path: string) {
    const url = await storage.signedUrl(path);
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo descargar");
    const c = await caches.open(CACHE);
    await c.put(offlineKey(path), res);
  },
  async remove(path: string) {
    const c = await caches.open(CACHE);
    await c.delete(offlineKey(path));
  },
  async get(path: string): Promise<ArrayBuffer | null> {
    if (!this.supported()) return null;
    const c = await caches.open(CACHE);
    const r = await c.match(offlineKey(path));
    return r ? r.arrayBuffer() : null;
  },
  async keys(): Promise<string[]> {
    if (!this.supported()) return [];
    const c = await caches.open(CACHE);
    return (await c.keys()).map((r) => decodeURIComponent(new URL(r.url).pathname.replace(/^\/offline\//, "")));
  },
};

/** DownloadService: fetch bytes, preferring the offline cache. */
export async function fetchAudioBytes(path: string): Promise<ArrayBuffer> {
  const cached = await offline.get(path);
  if (cached) return cached;
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new Error("Sin conexión");
  const url = await storage.signedUrl(path);
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar el archivo");
  return res.arrayBuffer();
}

export function formatBytes(n: number) {
  if (!n) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
}
