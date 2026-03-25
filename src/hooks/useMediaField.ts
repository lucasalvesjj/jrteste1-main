// ──────────────────────────────────────────────
// useMediaField — Hook de lógica para campo de mídia
// ──────────────────────────────────────────────
// Encapsula toda a lógica de seleção, remoção e
// normalização de valor para campos de mídia.
// Trabalha internamente com array normalizado,
// expondo a interface correta conforme o mode.
//
// Uso:
//   const field = useMediaField({
//     value: form.image,
//     onChange: (url) => updateField("image", url),
//     mode: "single",
//   });
//
//   <MediaFieldUI {...field} label="Imagem Destacada" />
// ──────────────────────────────────────────────

import { useCallback, useMemo } from "react";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import type { MediaSelectedInfo } from "@/data/mediaTypes";

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

export type MediaFieldMode = "single" | "multiple";

/** Opções para modo single — value é string, onChange recebe string */
export interface UseMediaFieldSingleOptions {
  mode?: "single";
  value: string;
  onChange: (url: string) => void;
  /** Tipo de origem para filtragem no modal */
  sourceType?: "post" | "page" | "standalone";
  /** ID da origem para filtragem no modal */
  sourceId?: string;
  /** Título do modal da Media Library */
  title?: string;
  /** Máximo de itens (ignorado em single, default: Infinity em multiple) */
  maxItems?: number;
}

/** Opções para modo multiple — value é string[], onChange recebe string[] */
export interface UseMediaFieldMultipleOptions {
  mode: "multiple";
  value: string[];
  onChange: (urls: string[]) => void;
  sourceType?: "post" | "page" | "standalone";
  sourceId?: string;
  title?: string;
  /** Máximo de itens selecionáveis (default: Infinity) */
  maxItems?: number;
}

export type UseMediaFieldOptions =
  | UseMediaFieldSingleOptions
  | UseMediaFieldMultipleOptions;

/** Retorno do hook — alimenta o MediaFieldUI */
export interface UseMediaFieldReturn {
  /** URLs normalizadas como array (sempre array internamente) */
  urls: string[];
  /** Se tem pelo menos uma imagem */
  hasValue: boolean;
  /** Modo de seleção */
  mode: MediaFieldMode;
  /** Máximo de itens */
  maxItems: number;
  /** Se atingiu o limite de itens */
  isAtLimit: boolean;
  /** Abre a Media Library */
  openLibrary: () => void;
  /** Remove uma URL pelo índice */
  removeAt: (index: number) => void;
  /** Remove todas as URLs */
  removeAll: () => void;
  /** Props do modal para renderizar <MediaLibrary /> */
  modalProps: ReturnType<typeof useMediaLibrary>["modalProps"];
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useMediaField(options: UseMediaFieldOptions): UseMediaFieldReturn {
  const mode = options.mode ?? "single";
  const maxItems = options.maxItems ?? Infinity;

  // ── Normaliza value como array ──
  const urls = useMemo(() => {
    if (mode === "single") {
      const val = (options as UseMediaFieldSingleOptions).value;
      return val ? [val] : [];
    }
    return (options as UseMediaFieldMultipleOptions).value ?? [];
  }, [mode, options.value]);

  const hasValue = urls.length > 0;
  const isAtLimit = urls.length >= maxItems;

  // ── Dispatch para o onChange do consumidor ──
  const dispatch = useCallback(
    (nextUrls: string[]) => {
      if (mode === "single") {
        (options.onChange as (url: string) => void)(nextUrls[0] ?? "");
      } else {
        (options.onChange as (urls: string[]) => void)(nextUrls);
      }
    },
    [mode, options.onChange],
  );

  // ── Ações ──
  const removeAt = useCallback(
    (index: number) => {
      const next = urls.filter((_, i) => i !== index);
      dispatch(next);
    },
    [urls, dispatch],
  );

  const removeAll = useCallback(() => {
    dispatch([]);
  }, [dispatch]);

  // ── Media Library hook ──
  const handleSingleSelect = useCallback(
    (info: MediaSelectedInfo) => {
      dispatch([info.url]);
    },
    [dispatch],
  );

  const handleMultipleSelect = useCallback(
    (infos: MediaSelectedInfo[]) => {
      // Concatena com existentes, respeitando maxItems
      const combined = [...urls, ...infos.map((i) => i.url)];
      const capped = maxItems < Infinity ? combined.slice(0, maxItems) : combined;
      dispatch(capped);
    },
    [urls, maxItems, dispatch],
  );

  // Conecta ao useMediaLibrary com o mode correto
  const mediaLibraryOptions = useMemo(() => {
    const base = {
      sourceType: options.sourceType,
      sourceId: options.sourceId,
      title: options.title ?? (mode === "single"
        ? "Selecionar Imagem"
        : "Selecionar Imagens"),
    };
    if (mode === "multiple") {
      return { ...base, mode: "multiple" as const, onSelect: handleMultipleSelect };
    }
    return { ...base, mode: "single" as const, onSelect: handleSingleSelect };
  }, [mode, options.sourceType, options.sourceId, options.title, handleSingleSelect, handleMultipleSelect]);

  const { open: openLibrary, modalProps } = useMediaLibrary(mediaLibraryOptions);

  return {
    urls,
    hasValue,
    mode,
    maxItems,
    isAtLimit,
    openLibrary,
    removeAt,
    removeAll,
    modalProps,
  };
}
