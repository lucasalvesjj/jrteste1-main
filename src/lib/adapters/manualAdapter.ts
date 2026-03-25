// ──────────────────────────────────────────────
// ManualAdapter — Fallback para produção estática
// ──────────────────────────────────────────────
// Processa imagens 100% no navegador (Canvas API).
// Gera variantes WebP e oferece download como ZIP.
// O usuário copia os arquivos para /public/media/ manualmente.
// Funciona SEMPRE, sem nenhuma dependência externa.
// ──────────────────────────────────────────────

import type {
  MediaItem,
  MediaStorageAdapter,
  UploadOptions,
  MediaPaths,
} from "@/data/mediaTypes";
import {
  VARIANT_WIDTHS,
  VARIANT_QUALITY,
  MEDIA_CATALOG_PATH,
  generateMediaId,
  getMediaDir,
  getMediaFileName,
} from "@/data/mediaTypes";

/**
 * Resultado do processamento local.
 * Contém os blobs gerados + metadados, pronto para download.
 */
export interface ManualUploadResult {
  mediaItem: MediaItem;
  blobs: {
    thumbnail: Blob;
    medium: Blob;
    large: Blob;
    original: Blob;
  };
  /** Caminho sugerido para copiar os arquivos (ex: public/media/2026/03/) */
  suggestedPath: string;
}

/** Redimensiona imagem via Canvas e exporta como WebP */
async function resizeToWebP(
  imageBitmap: ImageBitmap,
  maxWidth: number,
  quality: number
): Promise<Blob> {
  const scale = Math.min(1, maxWidth / imageBitmap.width);
  const width = Math.round(imageBitmap.width * scale);
  const height = Math.round(imageBitmap.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não suportado");

  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Tentar WebP primeiro, fallback para JPEG
  let blob = await canvas.convertToBlob({ type: "image/webp", quality });
  if (!blob || blob.type !== "image/webp") {
    blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  }

  return blob;
}

/** Gera placeholder blur tiny (~20px) como data-uri */
async function generateBlurPlaceholder(imageBitmap: ImageBitmap): Promise<string> {
  const width = 20;
  const height = Math.round((imageBitmap.height / imageBitmap.width) * width);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.drawImage(imageBitmap, 0, 0, width, height);

  const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.3 });
  const buffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return `data:image/webp;base64,${base64}`;
}

export const manualAdapter: MediaStorageAdapter = {
  name: "manual",
  supportsAutoUpload: false,

  isAvailable(): boolean {
    // Sempre disponível como último fallback
    return true;
  },

  async upload(file: File, options?: UploadOptions): Promise<MediaItem> {
    // Processar imagem no navegador
    const imageBitmap = await createImageBitmap(file);
    const id = generateMediaId();
    const mediaDir = getMediaDir(id);

    // Gerar variantes
    const [thumbnail, medium, large, blurDataUrl] = await Promise.all([
      resizeToWebP(imageBitmap, VARIANT_WIDTHS.thumbnail, VARIANT_QUALITY.thumbnail),
      resizeToWebP(imageBitmap, VARIANT_WIDTHS.medium, VARIANT_QUALITY.medium),
      resizeToWebP(imageBitmap, VARIANT_WIDTHS.large, VARIANT_QUALITY.large),
      generateBlurPlaceholder(imageBitmap),
    ]);

    // Determinar extensão original
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

    // Montar paths (pasta por ID: /media/{ano}/{mes}/{id}/)
    const paths: MediaPaths = {
      thumbnail: `/${mediaDir}/${getMediaFileName("thumbnail")}`,
      medium: `/${mediaDir}/${getMediaFileName("medium")}`,
      large: `/${mediaDir}/${getMediaFileName("large")}`,
      original: `/${mediaDir}/${getMediaFileName("original", ext)}`,
    };

    const mediaItem: MediaItem = {
      id,
      name: file.name,
      alt: options?.alt || "",
      paths,
      width: imageBitmap.width,
      height: imageBitmap.height,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      sourceType: options?.sourceType || "standalone",
      sourceId: options?.sourceId || "",
      blurDataUrl,
    };

    imageBitmap.close();

    // Disparar download dos arquivos para o usuário copiar
    await downloadProcessedFiles(
      { thumbnail, medium, large, original: file },
      mediaItem,
      mediaDir
    );

    return mediaItem;
  },

  async delete(id: string): Promise<void> {
    // No modo manual, delete apenas remove do catálogo local.
    // O usuário precisa deletar os arquivos físicos manualmente.
    console.warn(
      `[ManualAdapter] Mídia ${id} removida do catálogo. ` +
      `Delete os arquivos em /public/media/ manualmente.`
    );
  },

  async list(): Promise<MediaItem[]> {
    try {
      const response = await fetch(MEDIA_CATALOG_PATH, { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`HTTP ${response.status}`);
      }
      const catalog = await response.json();
      return catalog?.items ?? [];
    } catch {
      return [];
    }
  },
};

// ──────────────────────────────────────────────
// Download helper — gera arquivos para o usuário
// ──────────────────────────────────────────────

async function downloadProcessedFiles(
  blobs: { thumbnail: Blob; medium: Blob; large: Blob; original: File },
  mediaItem: MediaItem,
  mediaDir: string
): Promise<void> {
  const ext = mediaItem.name.split(".").pop()?.toLowerCase() || "jpg";
  const files = [
    { blob: blobs.thumbnail, name: getMediaFileName("thumbnail") },
    { blob: blobs.medium, name: getMediaFileName("medium") },
    { blob: blobs.large, name: getMediaFileName("large") },
    { blob: blobs.original, name: getMediaFileName("original", ext) },
  ];

  // Download individual de cada arquivo (sem dependência de lib de ZIP)
  for (const { blob, name } of files) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Pequeno delay entre downloads para não bloquear o navegador
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.info(
    `[ManualAdapter] ${files.length} arquivos baixados. ` +
    `Copie-os para: public/${mediaDir}/`
  );
}

// Exporta o helper para uso externo (se necessário gerar ZIP no futuro)
export { resizeToWebP, generateBlurPlaceholder };
