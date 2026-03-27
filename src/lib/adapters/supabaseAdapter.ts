// ──────────────────────────────────────────────────────────────
// SupabaseAdapter — Upload real de mídia via Supabase Storage
// ──────────────────────────────────────────────────────────────
// Ativado automaticamente quando:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGci...
//
// Setup no Supabase (fazer UMA vez):
//   1. supabase.com → novo projeto
//   2. Storage → New bucket → nome: "media" → Public: ON
//   3. Settings → API → copiar URL e anon key
//   4. Adicionar as env vars no Lovable:
//      Project Settings → Environment Variables
// ──────────────────────────────────────────────────────────────

import type {
  MediaItem,
  MediaStorageAdapter,
  UploadOptions,
  MediaPaths,
  MediaCatalog,
} from "@/data/mediaTypes";
import {
  VARIANT_WIDTHS,
  VARIANT_QUALITY,
  MEDIA_CATALOG_VERSION,
  generateMediaId,
  getMediaDir,
  getMediaFileName,
} from "@/data/mediaTypes";

// ── Helpers de imagem (reutilizados do manualAdapter) ──────────

async function resizeToWebP(
  bitmap: ImageBitmap,
  maxWidth: number,
  quality: number
): Promise<Blob> {
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não suportado");
  ctx.drawImage(bitmap, 0, 0, w, h);
  let blob = await canvas.convertToBlob({ type: "image/webp", quality });
  if (!blob || blob.type !== "image/webp") {
    blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  }
  return blob;
}

async function generateBlurPlaceholder(bitmap: ImageBitmap): Promise<string> {
  const w = 20;
  const h = Math.round((bitmap.height / bitmap.width) * w);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.3 });
  const buffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return `data:image/webp;base64,${base64}`;
}

// ── Cliente Supabase mínimo (sem SDK extra) ────────────────────

function supabaseHeaders(): Record<string, string> {
  return {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
}

function storageUrl(path: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/media/${path}`;
}

function publicUrl(path: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/media/${path}`;
}

/** Faz upload de um Blob para o bucket "media" no Supabase */
async function uploadBlob(path: string, blob: Blob): Promise<void> {
  const res = await fetch(storageUrl(path), {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      "Content-Type": blob.type,
      "x-upsert": "true",
    },
    body: blob,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upload falhou (${res.status}): ${err}`);
  }
}

/** Remove um arquivo do bucket "media" */
async function deleteBlob(path: string): Promise<void> {
  const base = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, "");
  const url = `${base}/storage/v1/object/media`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { ...supabaseHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] }),
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Supabase delete falhou (${res.status}): ${err}`);
  }
}

// ── Catálogo via GitHub API ────────────────────────────────────
// O media-library.json é mantido no repositório e lido via fetch.
// Para atualizar o catálogo em produção, salvamos no localStorage
// como cache e atualizamos via publicação GitHub (igual ao blog).

const CATALOG_STORAGE_KEY = "comercial-jr-media-catalog";

function loadLocalCatalog(): MediaCatalog | null {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MediaCatalog;
  } catch { return null; }
}

function saveLocalCatalog(catalog: MediaCatalog): void {
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  } catch { /* silencia */ }
}

async function fetchRemoteCatalog(): Promise<MediaCatalog> {
  const res = await fetch("/data/media-library.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as MediaCatalog;
}

async function loadCatalog(): Promise<MediaCatalog> {
  try {
    return await fetchRemoteCatalog();
  } catch {
    return loadLocalCatalog() ?? {
      version: MEDIA_CATALOG_VERSION,
      updatedAt: new Date().toISOString(),
      items: [],
    };
  }
}

function buildUpdatedCatalog(items: MediaCatalog["items"]): MediaCatalog {
  return {
    version: MEDIA_CATALOG_VERSION,
    updatedAt: new Date().toISOString(),
    items,
  };
}

/** Publica o catálogo atualizado via GitHub API (reutiliza config do blog) */
async function publishCatalogToGitHub(catalog: MediaCatalog): Promise<void> {
  const raw = localStorage.getItem("comercial-jr-github-publish-config");
  if (!raw) return; // sem config: salva só localmente
  const config = JSON.parse(raw) as {
    token: string; repo: string; branch?: string;
  };

  const filePath = "public/data/media-library.json";
  const branch   = config.branch ?? "main";
  const content  = btoa(unescape(encodeURIComponent(JSON.stringify(catalog, null, 2))));
  const headers  = {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const apiUrl = `https://api.github.com/repos/${config.repo}/contents/${filePath}`;

  let sha: string | undefined;
  try {
    const get = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    if (get.ok) sha = ((await get.json()) as { sha?: string }).sha;
  } catch { /* arquivo pode não existir */ }

  const body: Record<string, unknown> = {
    message: "media: atualiza catálogo via admin",
    content, branch,
  };
  if (sha) body.sha = sha;

  await fetch(apiUrl, { method: "PUT", headers, body: JSON.stringify(body) });
}

// ── Adapter principal ─────────────────────────────────────────

export const supabaseAdapter: MediaStorageAdapter = {
  name: "supabase",
  supportsAutoUpload: true,

  isAvailable(): boolean {
    return !!(
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  },

  async upload(file: File, options?: UploadOptions): Promise<MediaItem> {
    const bitmap = await createImageBitmap(file);
    const id = generateMediaId();
    const mediaDir = getMediaDir(id);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";

    // Gerar variantes + blur placeholder em paralelo
    const originalWidth  = bitmap.width;
    const originalHeight = bitmap.height;

    const [thumbnail, medium, large, blurDataUrl] = await Promise.all([
      resizeToWebP(bitmap, VARIANT_WIDTHS.thumbnail, VARIANT_QUALITY.thumbnail),
      resizeToWebP(bitmap, VARIANT_WIDTHS.medium,    VARIANT_QUALITY.medium),
      resizeToWebP(bitmap, VARIANT_WIDTHS.large,     VARIANT_QUALITY.large),
      generateBlurPlaceholder(bitmap),
    ]);
    bitmap.close();

    // Paths dentro do bucket (sem leading slash)
    const thumbPath    = `${mediaDir}/${getMediaFileName("thumbnail")}`;
    const medPath      = `${mediaDir}/${getMediaFileName("medium")}`;
    const largePath    = `${mediaDir}/${getMediaFileName("large")}`;
    const origPath     = `${mediaDir}/${getMediaFileName("original", ext)}`;

    // Upload de todas as variantes em paralelo
    await Promise.all([
      uploadBlob(thumbPath, thumbnail),
      uploadBlob(medPath,   medium),
      uploadBlob(largePath, large),
      uploadBlob(origPath,  file),
    ]);

    // URLs públicas do CDN Supabase
    const paths: MediaPaths = {
      thumbnail: publicUrl(thumbPath),
      medium:    publicUrl(medPath),
      large:     publicUrl(largePath),
      original:  publicUrl(origPath),
    };

    const item: MediaItem = {
      id,
      name: file.name,
      alt: options?.alt ?? "",
      paths,
      width: originalWidth,
      height: originalHeight,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      sourceType: options?.sourceType ?? "standalone",
      sourceId: options?.sourceId ?? "",
      blurDataUrl,
    };

    // Atualizar catálogo local + publicar no GitHub
    const catalog = await loadCatalog();
    catalog.items.unshift(item);
    catalog.updatedAt = new Date().toISOString();
    saveLocalCatalog(catalog);
    // Publica em background (não bloqueia o retorno)
    void publishCatalogToGitHub(catalog);

    return item;
  },

  async delete(id: string): Promise<void> {
    const catalog = await loadCatalog();
    const item = catalog.items.find((i) => i.id === id);

    if (item) {
      // Remove todas as variantes do bucket em paralelo
      const paths = [
        item.paths.thumbnail,
        item.paths.medium,
        item.paths.large,
        item.paths.original,
      ].map((url) => {
        // Extrai o path relativo da URL pública
        const marker = "/object/public/media/";
        const idx = url.indexOf(marker);
        return idx !== -1 ? url.slice(idx + marker.length) : "";
      }).filter(Boolean);

      await Promise.allSettled(paths.map(deleteBlob));

      catalog.items = catalog.items.filter((i) => i.id !== id);
      catalog.updatedAt = new Date().toISOString();
      saveLocalCatalog(catalog);
      void publishCatalogToGitHub(catalog);
    }
  },

  async list(): Promise<MediaItem[]> {
    const catalog = await loadCatalog();
    return catalog.items;
  },
};
