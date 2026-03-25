// ──────────────────────────────────────────────
// Media Store — Zustand store para Media Library
// ──────────────────────────────────────────────
// Gerencia estado da galeria: lista de mídias, loading,
// seleção (single e multi), filtros.
// Alimentado pela Media API (facade).
// NÃO persiste no localStorage — os dados vêm do catálogo
// JSON a cada abertura do modal.
//
// Seleção dual:
//   - selectedId:  string | null   → seleção única (compatibilidade)
//   - selectedIds: string[]        → seleção múltipla
//   - lastSelectedId: string|null  → último item clicado (futuro Shift+click)
//   Ambos são explícitos no estado para evitar
//   inconsistências com Zustand (sem getter derivado).
// ──────────────────────────────────────────────

import { create } from "zustand";
import type { MediaItem, MediaSourceType } from "@/data/mediaTypes";
import { listMedia, deleteMedia, uploadMedia } from "@/lib/mediaApi";
import type { UploadOptions } from "@/data/mediaTypes";

// ──────────────────────────────────────────────
// Tipos do Store
// ──────────────────────────────────────────────

type MediaLoadState = "idle" | "loading" | "loaded" | "error";

export type MediaSortBy = "date-desc" | "date-asc" | "name-asc" | "name-desc" | "size-desc" | "size-asc";

export interface MediaFilters {
  /** Filtra por tipo de origem (post, page, standalone) */
  sourceType?: MediaSourceType;
  /** Filtra por ID/slug da origem */
  sourceId?: string;
  /** Busca por nome do arquivo */
  search?: string;
  /** Ordenação */
  sortBy?: MediaSortBy;
}

/** Placeholder visual durante upload */
export interface UploadingPlaceholder {
  id: string;
  name: string;
  previewUrl: string;
  progress: string;
}

interface MediaStore {
  // ── Estado ──
  items: MediaItem[];
  loadState: MediaLoadState;
  error: string | null;
  filters: MediaFilters;

  // ── Seleção ──
  /** ID da mídia selecionada (modo single). Explícito no estado. */
  selectedId: string | null;
  /** IDs das mídias selecionadas (modo multiple). Explícito no estado. */
  selectedIds: string[];
  /**
   * Último item clicado — usado como âncora para futura
   * seleção em range (Shift+click). Atualizado por selectItem
   * e toggleSelectItem.
   */
  lastSelectedId: string | null;

  // ── Upload state ──
  uploading: boolean;
  uploadProgress: string | null;
  uploadingPlaceholder: UploadingPlaceholder | null;

  // ── Ações ──
  /** Carrega a lista de mídias do catálogo */
  loadItems: () => Promise<void>;

  /** Faz upload de um arquivo */
  uploadItem: (file: File, options?: UploadOptions) => Promise<MediaItem>;

  /** Remove uma mídia */
  deleteItem: (id: string) => Promise<void>;

  /**
   * Seleciona UMA mídia (modo single).
   * Atualiza selectedId, substitui selectedIds por [id],
   * e registra lastSelectedId.
   * Passar null limpa toda a seleção.
   */
  selectItem: (id: string | null) => void;

  /**
   * Toggle de seleção (modo multiple).
   * Se o ID já está em selectedIds, remove. Se não, adiciona.
   * Atualiza selectedId para o último adicionado (ou null se array ficou vazio).
   * Registra lastSelectedId para futuro Shift+click.
   */
  toggleSelectItem: (id: string) => void;

  /**
   * Retorna os MediaItem[] correspondentes a selectedIds.
   * Mantém a ordem de selectedIds.
   */
  getSelectedItems: () => MediaItem[];

  /** Atualiza filtros */
  setFilters: (filters: Partial<MediaFilters>) => void;

  /** Limpa filtros */
  clearFilters: () => void;

  /** Reset leve ao fechar modal — mantém items e filtros, limpa seleção */
  softReset: () => void;

  /** Reset completo (para uso interno/testes) */
  hardReset: () => void;

  /** Retorna itens filtrados (derivado, não armazenado) */
  getFilteredItems: () => MediaItem[];
}

// ──────────────────────────────────────────────
// Estado inicial
// ──────────────────────────────────────────────

const initialState = {
  items: [] as MediaItem[],
  loadState: "idle" as MediaLoadState,
  error: null as string | null,
  filters: {} as MediaFilters,
  selectedId: null as string | null,
  selectedIds: [] as string[],
  lastSelectedId: null as string | null,
  uploading: false,
  uploadProgress: null as string | null,
  uploadingPlaceholder: null as UploadingPlaceholder | null,
};

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useMediaStore = create<MediaStore>()((set, get) => ({
  ...initialState,

  loadItems: async () => {
    if (get().loadState === "loading") return;

    set({ loadState: "loading", error: null });

    try {
      const items = await listMedia();
      const sorted = [...items].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      set({ items: sorted, loadState: "loaded" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar mídias";
      set({ loadState: "error", error: message });
      console.error("[MediaStore] Erro ao carregar:", err);
    }
  },

  uploadItem: async (file, options) => {
    const previewUrl = URL.createObjectURL(file);
    const placeholderId = `uploading-${Date.now()}`;

    set({
      uploading: true,
      uploadProgress: "Processando imagem...",
      uploadingPlaceholder: {
        id: placeholderId,
        name: file.name,
        previewUrl,
        progress: "Enviando...",
      },
    });

    try {
      const mediaItem = await uploadMedia(file, options);
      URL.revokeObjectURL(previewUrl);

      // Auto-seleciona o item enviado (atualiza ambos os campos)
      set((state) => ({
        items: [mediaItem, ...state.items],
        uploading: false,
        uploadProgress: null,
        uploadingPlaceholder: null,
        selectedId: mediaItem.id,
        selectedIds: [mediaItem.id],
        lastSelectedId: mediaItem.id,
      }));

      return mediaItem;
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      set({ uploading: false, uploadProgress: null, uploadingPlaceholder: null });
      throw err;
    }
  },

  deleteItem: async (id) => {
    try {
      await deleteMedia(id);

      set((state) => {
        const nextIds = state.selectedIds.filter((sid) => sid !== id);
        return {
          items: state.items.filter((item) => item.id !== id),
          selectedId: state.selectedId === id ? (nextIds[nextIds.length - 1] ?? null) : state.selectedId,
          selectedIds: nextIds,
          lastSelectedId: state.lastSelectedId === id ? null : state.lastSelectedId,
        };
      });
    } catch (err) {
      console.error("[MediaStore] Erro ao deletar:", err);
      throw err;
    }
  },

  // ── Seleção single: substitui tudo por um único item ──
  selectItem: (id) => {
    if (id === null) {
      set({ selectedId: null, selectedIds: [], lastSelectedId: null });
    } else {
      set({ selectedId: id, selectedIds: [id], lastSelectedId: id });
    }
  },

  // ── Seleção multiple: toggle adiciona/remove do array ──
  toggleSelectItem: (id) => {
    set((state) => {
      const exists = state.selectedIds.includes(id);
      let nextIds: string[];

      if (exists) {
        // Remove do array
        nextIds = state.selectedIds.filter((sid) => sid !== id);
      } else {
        // Adiciona ao array
        nextIds = [...state.selectedIds, id];
      }

      return {
        selectedIds: nextIds,
        // selectedId acompanha: último adicionado, ou primeiro restante, ou null
        selectedId: exists
          ? (nextIds[nextIds.length - 1] ?? null)
          : id,
        // lastSelectedId é sempre o último clicado (não importa se add ou remove)
        lastSelectedId: id,
      };
    });
  },

  getSelectedItems: () => {
    const { items, selectedIds } = get();
    // Mapeia mantendo a ordem de selectedIds
    const itemMap = new Map(items.map((item) => [item.id, item]));
    return selectedIds
      .map((id) => itemMap.get(id))
      .filter((item): item is MediaItem => item !== undefined);
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  // Soft reset: limpa toda a seleção, mantém items e filtros
  softReset: () => {
    set({
      selectedId: null,
      selectedIds: [],
      lastSelectedId: null,
    });
  },

  hardReset: () => {
    const placeholder = get().uploadingPlaceholder;
    if (placeholder) {
      URL.revokeObjectURL(placeholder.previewUrl);
    }
    set(initialState);
  },

  getFilteredItems: () => {
    const { items, filters } = get();

    const filtered = items.filter((item) => {
      if (filters.sourceType && item.sourceType !== filters.sourceType) {
        return false;
      }
      if (filters.sourceId && item.sourceId !== filters.sourceId) {
        return false;
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(search);
        const matchAlt = item.alt.toLowerCase().includes(search);
        if (!matchName && !matchAlt) return false;
      }
      return true;
    });

    const sortBy = filters.sortBy || "date-desc";
    if (sortBy !== "date-desc") {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "date-asc":
            return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          case "name-asc":
            return a.name.localeCompare(b.name, "pt-BR");
          case "name-desc":
            return b.name.localeCompare(a.name, "pt-BR");
          case "size-desc":
            return b.size - a.size;
          case "size-asc":
            return a.size - b.size;
          default:
            return 0;
        }
      });
    }

    return filtered;
  },
}));
