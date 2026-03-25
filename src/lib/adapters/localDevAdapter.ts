// ──────────────────────────────────────────────
// LocalDevAdapter — Upload via Vite Plugin (npm run dev)
// ──────────────────────────────────────────────
// Envia arquivos para POST /api/upload no dev server.
// Sharp processa e salva em /public/media/{ano}/{mes}/.
// Funciona APENAS durante desenvolvimento (npm run dev).
// ──────────────────────────────────────────────

import type {
  MediaItem,
  MediaStorageAdapter,
  UploadOptions,
} from "@/data/mediaTypes";

export const localDevAdapter: MediaStorageAdapter = {
  name: "local-dev",
  supportsAutoUpload: true,

  isAvailable(): boolean {
    return import.meta.env.DEV;
  },

  async upload(file: File, options?: UploadOptions): Promise<MediaItem> {
    const formData = new FormData();
    formData.append("file", file);

    if (options?.alt) formData.append("alt", options.alt);
    if (options?.sourceType) formData.append("sourceType", options.sourceType);
    if (options?.sourceId) formData.append("sourceId", options.sourceId);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `Upload falhou (${response.status}): ${errorBody || response.statusText}`
      );
    }

    const mediaItem: MediaItem = await response.json();
    return mediaItem;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/media/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `Exclusão falhou (${response.status}): ${errorBody || response.statusText}`
      );
    }
  },

  async list(): Promise<MediaItem[]> {
    const response = await fetch("/data/media-library.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Erro ao carregar catálogo (${response.status})`);
    }

    const catalog = await response.json();
    return catalog?.items ?? [];
  },
};
