// ──────────────────────────────────────────────────────────────
// SupabaseAdapter — Upload real de mídia via Supabase Storage
// ──────────────────────────────────────────────────────────────
// Ativado automaticamente quando as env vars estão definidas:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGci...
//
// Setup no Supabase (uma vez):
//   1. supabase.com → New Project
//   2. Storage → New Bucket → nome: "media" → Public: ON
//   3. Settings → API → copiar Project URL e anon/public key
//   4. Lovable → Project Settings → Environment Variables → adicionar as duas vars
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
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabaseConfig";

// ── Helpers de processamento de imagem ────────────────────────

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
  try {
    const w = 20;
    const h = Math.max(1, Math.round((bitmap.height / bitmap.width) * w));
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.3 });
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return `data:image/webp;base64,${base64}`;
  } catch {
    return "";
  }
}

// ── Cliente Supabase Storage (sem SDK) ────────────────────────

function getEnv() {
  const url = SUPABASE_URL;
  const key = SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Variáveis Supabase não configuradas");
  return { url: url.replace(/\/$/, ""), key };
}

function authHeaders(): Record<string, string> {
  const { key } = getEnv();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

/** URL de upload (POST para criar, PUT para sobrescrever) */
function uploadEndpoint(path: string): string {
  const { url } = getEnv();
  return `${url}/storage/v1/object/media/${path}`;
}

/** URL pública do CDN para servir a imagem */
function publicUrl(path: string): string {
  const { url } = getEnv();
  return `${url}/storage/v1/object/public/media/${path}`;
}

/** Faz upload de um Blob para o bucket "media" */
async function uploadBlob(path: string, blob: Blob): Promise<void> {
  const res = await fetch(uploadEndpoint(path), {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": blob.type || "application/octet-stream",
      "x-upsert": "true",   // substitui se já existir
      "cache-control": "3600",
    },
    body: blob,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Upload falhou [${res.status}] ${path}: ${body}`);
  }
}

/** Remove arquivos do bucket pelo path relativo (dentro de "media") */
async function deletePaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { url } = getEnv();
  const endpoint = `${url}/storage/v1/object/media`;

  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: paths }),
  });

  // 404 é aceitável (arquivo já deletado)
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => res.statusText);
    console.warn(`[SupabaseAdapter] Delete parcial [${res.status}]: ${body}`);
  }
}

// ── Catálogo de mídia (localStorage + GitHub) ─────────────────
// O catálogo é lido do /data/media-library.json servido pelo site.
// Após cada upload/delete, é atualizado no localStorage e publicado
// no GitHub via API (usando a mesma config do botão "Publicar no GitHub").

const CATALOG_KEY = "comercial-jr-media-catalog";
const GITHUB_CONFIG_KEY = "comercial-jr-github-publish-config";

function loadLocalCatalog(): MediaCatalog | null {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    return raw ? (JSON.parse(raw) as MediaCatalog) : null;
  } catch { return null; }
}

function saveLocalCatalog(catalog: MediaCatalog): void {
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
  } catch { /* ignora erros de storage */ }
}

async function loadCatalog(): Promise<MediaCatalog> {
  // Tenta buscar do servidor (versão publicada)
  try {
    const res = await fetch("/data/media-library.json", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as MediaCatalog;
      // Mescla com localStorage para incluir itens ainda não publicados
      const local = loadLocalCatalog();
      if (local && local.updatedAt > (data.updatedAt ?? "")) {
        return local;
      }
      return data;
    }
  } catch { /* servidor não respondeu */ }

  // Fallback: localStorage
  return loadLocalCatalog() ?? {
    version: MEDIA_CATALOG_VERSION,
    updatedAt: new Date().toISOString(),
    items: [],
  };
}

/** Publica media-library.json no GitHub em background */
async function publishCatalog(catalog: MediaCatalog): Promise<void> {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (!raw) return; // sem config GitHub configurada, só salva local

    const cfg = JSON.parse(raw) as { token: string; repo: string; branch?: string };
    if (!cfg.token || !cfg.repo) return;

    const branch  = cfg.branch ?? "main";
    const apiPath = "public/data/media-library.json";
    const apiUrl  = `https://api.github.com/repos/${cfg.repo}/contents/${apiPath}`;
    const headers = {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // Busca SHA atual (necessário para update)
    let sha: string | undefined;
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    if (getRes.ok) {
      sha = ((await getRes.json()) as { sha?: string }).sha;
    }

    // Codifica conteúdo em base64 preservando UTF-8
    const json    = JSON.stringify(catalog, null, 2);
    const bytes   = new TextEncoder().encode(json);
    const binary  = Array.from(bytes).map((b) => String.fromCharCode(b)).join("");
    const content = btoa(binary);

    const body: Record<string, unknown> = {
      message: "media: atualiza catálogo via admin",
      content, branch,
    };
    if (sha) body.sha = sha;

    await fetch(apiUrl, { method: "PUT", headers, body: JSON.stringify(body) });
  } catch (err) {
    // Não bloqueia o upload — falha silenciosa com log
    console.warn("[SupabaseAdapter] Falha ao publicar catálogo no GitHub:", err);
  }
}

// ── Adapter principal ─────────────────────────────────────────

export const supabaseAdapter: MediaStorageAdapter = {
  name: "supabase",
  supportsAutoUpload: true,

  isAvailable(): boolean {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  },

  async upload(file: File, options?: UploadOptions): Promise<MediaItem> {
    // 1. Processa imagem no browser
    const bitmap = await createImageBitmap(file);
    const originalWidth  = bitmap.width;
    const originalHeight = bitmap.height;

    const [thumbnail, medium, large, blurDataUrl] = await Promise.all([
      resizeToWebP(bitmap, VARIANT_WIDTHS.thumbnail, VARIANT_QUALITY.thumbnail),
      resizeToWebP(bitmap, VARIANT_WIDTHS.medium,    VARIANT_QUALITY.medium),
      resizeToWebP(bitmap, VARIANT_WIDTHS.large,     VARIANT_QUALITY.large),
      generateBlurPlaceholder(bitmap),
    ]);
    bitmap.close();

    // 2. Gera paths únicos
    const id       = generateMediaId();
    const mediaDir = getMediaDir(id);
    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";

    const thumbPath = `${mediaDir}/${getMediaFileName("thumbnail")}`;
    const medPath   = `${mediaDir}/${getMediaFileName("medium")}`;
    const largePath = `${mediaDir}/${getMediaFileName("large")}`;
    const origPath  = `${mediaDir}/${getMediaFileName("original", ext)}`;

    // 3. Faz upload paralelo de todas as variantes
    await Promise.all([
      uploadBlob(thumbPath, thumbnail),
      uploadBlob(medPath,   medium),
      uploadBlob(largePath, large),
      uploadBlob(origPath,  file),
    ]);

    // 4. Monta MediaItem com URLs públicas
    const paths: MediaPaths = {
      thumbnail: publicUrl(thumbPath),
      medium:    publicUrl(medPath),
      large:     publicUrl(largePath),
      original:  publicUrl(origPath),
    };

    const item: MediaItem = {
      id,
      name: file.name,
      alt:  options?.alt ?? "",
      paths,
      width:      originalWidth,
      height:     originalHeight,
      size:       file.size,
      mimeType:   file.type,
      uploadedAt: new Date().toISOString(),
      sourceType: options?.sourceType ?? "standalone",
      sourceId:   options?.sourceId   ?? "",
      blurDataUrl,
    };

    // 5. Atualiza catálogo local e publica no GitHub em background
    const catalog = await loadCatalog();
    catalog.items = [item, ...catalog.items.filter((i) => i.id !== item.id)];
    catalog.updatedAt = new Date().toISOString();
    saveLocalCatalog(catalog);
    void publishCatalog(catalog);

    return item;
  },

  async delete(id: string): Promise<void> {
    const catalog = await loadCatalog();
    const item = catalog.items.find((i) => i.id === id);

    if (item) {
      // Extrai paths relativos das URLs públicas
      const marker = "/storage/v1/object/public/media/";
      const relativePaths = [
        item.paths.thumbnail,
        item.paths.medium,
        item.paths.large,
        item.paths.original,
      ]
        .map((url) => {
          const idx = url.indexOf(marker);
          return idx !== -1 ? url.slice(idx + marker.length) : "";
        })
        .filter(Boolean);

      // Remove do bucket (falhas não bloqueiam remoção do catálogo)
      await deletePaths(relativePaths).catch((err) =>
        console.warn("[SupabaseAdapter] Erro ao deletar do bucket:", err)
      );

      // Atualiza catálogo
      catalog.items = catalog.items.filter((i) => i.id !== id);
      catalog.updatedAt = new Date().toISOString();
      saveLocalCatalog(catalog);
      void publishCatalog(catalog);
    }
  },

  async list(): Promise<MediaItem[]> {
    const catalog = await loadCatalog();
    return catalog.items;
  },
};
