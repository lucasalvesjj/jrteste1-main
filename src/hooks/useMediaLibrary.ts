// ──────────────────────────────────────────────
// useMediaLibrary — Hook reutilizável para Media Library
// ──────────────────────────────────────────────
// Encapsula a lógica de abrir/fechar o modal, carregar
// mídias, e retornar o(s) item(ns) selecionado(s) via callback.
//
// Suporte a dois modos:
//   - "single" (padrão): seleciona uma mídia, fecha automaticamente
//   - "multiple": seleciona várias mídias, fecha ao confirmar
//
// Retorno padronizado:
//   O callback onSelect recebe MediaSelectedInfo (ou array),
//   que é uma versão desacoplada do MediaItem completo.
//   O consumidor não precisa saber de paths internos —
//   recebe url, thumbnail, width, height, alt diretamente.
//
// Filtragem por contexto:
//   sourceType e sourceId permitem que a Media Library
//   abra pré-filtrada para o contexto do consumidor
//   (ex: imagens de um post específico).
//
// Uso típico (single):
//   const { open, modalProps } = useMediaLibrary({
//     onSelect: (info) => updateField("image", info.url),
//   });
//
// Uso típico (multiple):
//   const { open, modalProps } = useMediaLibrary({
//     mode: "multiple",
//     onSelect: (infos) => setGallery(infos.map(i => i.url)),
//   });
// ──────────────────────────────────────────────

import { useCallback, useState } from "react";
import type { MediaItem, MediaSourceType, MediaSelectedInfo } from "@/data/mediaTypes";
import { toMediaSelectedInfo } from "@/data/mediaTypes";

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

/** Modo de seleção da Media Library */
export type MediaLibraryMode = "single" | "multiple";

/** Opções base compartilhadas entre single e multiple */
interface UseMediaLibraryOptionsBase {
  /**
   * Filtro inicial por tipo de origem.
   * Permite que a Media Library abra pré-filtrada para o contexto
   * do consumidor (ex: "post" mostra apenas mídias de posts).
   */
  sourceType?: MediaSourceType;

  /**
   * Filtro inicial por ID/slug da origem.
   * Combinado com sourceType, filtra mídias de uma entidade específica
   * (ex: sourceType="post" + sourceId="meu-post" mostra apenas
   * mídias associadas àquele post).
   */
  sourceId?: string;

  /** Título personalizado do modal (default: "Biblioteca de Mídia") */
  title?: string;

  /**
   * Se o modal fecha automaticamente ao confirmar a seleção.
   * - true (padrão): fecha ao clicar "Selecionar"
   * - false: mantém aberto após seleção (útil para múltiplos campos)
   */
  autoClose?: boolean;
}

/** Opções para modo single (padrão) — callback recebe MediaSelectedInfo */
export interface UseMediaLibrarySingleOptions extends UseMediaLibraryOptionsBase {
  mode?: "single";
  onSelect: (info: MediaSelectedInfo) => void;
}

/** Opções para modo multiple — callback recebe MediaSelectedInfo[] */
export interface UseMediaLibraryMultipleOptions extends UseMediaLibraryOptionsBase {
  mode: "multiple";
  onSelect: (infos: MediaSelectedInfo[]) => void;
}

/** União discriminada — TypeScript infere o tipo de onSelect pelo mode */
export type UseMediaLibraryOptions =
  | UseMediaLibrarySingleOptions
  | UseMediaLibraryMultipleOptions;

export interface UseMediaLibraryReturn {
  /** Abre o modal da Media Library */
  open: () => void;

  /** Fecha o modal */
  close: () => void;

  /** Se o modal está aberto */
  isOpen: boolean;

  /** Props para passar ao componente MediaLibrary */
  modalProps: MediaLibraryModalProps;
}

/**
 * Props que o componente MediaLibrary.tsx espera receber.
 *
 * O componente trabalha internamente com MediaItem.
 * A transformação para MediaSelectedInfo acontece no hook,
 * de forma transparente para o componente.
 */
export interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;

  /** Handler para seleção única — recebe MediaItem do componente */
  onSelect: (item: MediaItem) => void;

  /** Handler para seleção múltipla — recebe MediaItem[] do componente */
  onSelectMultiple: (items: MediaItem[]) => void;

  /** Modo de seleção — controla UI do grid e footer */
  mode: MediaLibraryMode;

  /** Se o modal fecha automaticamente ao confirmar */
  autoClose: boolean;

  title?: string;

  /** Filtro por tipo de origem — aplicado ao abrir o modal */
  initialSourceType?: MediaSourceType;

  /** Filtro por ID/slug da origem — aplicado ao abrir o modal */
  initialSourceId?: string;
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useMediaLibrary(options: UseMediaLibraryOptions): UseMediaLibraryReturn {
  const [isOpen, setIsOpen] = useState(false);

  const mode = options.mode ?? "single";
  const autoClose = options.autoClose ?? true;

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ── Handler single: converte MediaItem → MediaSelectedInfo ──
  const handleSelect = useCallback(
    (item: MediaItem) => {
      if (mode === "single") {
        const info = toMediaSelectedInfo(item);
        (options.onSelect as (info: MediaSelectedInfo) => void)(info);
      }
      if (autoClose) setIsOpen(false);
    },
    [options.onSelect, mode, autoClose],
  );

  // ── Handler multiple: converte MediaItem[] → MediaSelectedInfo[] ──
  const handleSelectMultiple = useCallback(
    (items: MediaItem[]) => {
      if (mode === "multiple") {
        const infos = items.map(toMediaSelectedInfo);
        (options.onSelect as (infos: MediaSelectedInfo[]) => void)(infos);
      }
      if (autoClose) setIsOpen(false);
    },
    [options.onSelect, mode, autoClose],
  );

  return {
    open,
    close,
    isOpen,
    modalProps: {
      isOpen,
      onClose: close,
      onSelect: handleSelect,
      onSelectMultiple: handleSelectMultiple,
      mode,
      autoClose,
      title: options.title,
      initialSourceType: options.sourceType,
      initialSourceId: options.sourceId,
    },
  };
}
