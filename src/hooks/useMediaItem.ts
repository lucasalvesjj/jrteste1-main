// ──────────────────────────────────────────────
// useMediaItem — Lookup de MediaItem por URL/src
// ──────────────────────────────────────────────
// Dado um src (URL de imagem usada num post ou página),
// retorna o MediaItem correspondente do catálogo,
// se disponível.
//
// Usado para obter width, height e blurDataUrl de imagens
// referenciadas em posts — sem alterar o schema do BlogPost.
//
// Estratégia: compara src contra todos os paths do MediaItem
// (large, medium, thumbnail, original). Match em qualquer variante
// retorna o item completo.
// ──────────────────────────────────────────────

import { useMemo } from "react";
import { useMediaStore } from "@/stores/mediaStore";
import type { MediaItem } from "@/data/mediaTypes";

/**
 * Retorna o MediaItem que contém o src fornecido em qualquer
 * uma de suas variantes (large, medium, thumbnail, original).
 *
 * Retorna `null` se o src não for encontrado no catálogo ou
 * se o catálogo ainda não foi carregado.
 *
 * @param src  URL/path da imagem (ex: item.paths.large)
 */
export function useMediaItem(src: string | undefined): MediaItem | null {
  const items = useMediaStore((s) => s.items);

  return useMemo(() => {
    if (!src || items.length === 0) return null;

    return (
      items.find(
        (item) =>
          item.paths.large     === src ||
          item.paths.medium    === src ||
          item.paths.thumbnail === src ||
          item.paths.original  === src
      ) ?? null
    );
  }, [src, items]);
}
