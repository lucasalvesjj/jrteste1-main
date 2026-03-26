// ──────────────────────────────────────────────
// contentImages — Enriquecimento de <img> em HTML rico
// ──────────────────────────────────────────────
// Processa o HTML de conteúdo de posts e injeta
// atributos de otimização nas <img> detectadas:
//   - srcset com variantes Media Library (300w/800w/1920w)
//   - sizes responsivo adequado ao contexto do post
//   - loading="lazy" e decoding="async"
//   - width/height do MediaItem (se disponível) para evitar CLS
//
// Estratégia conservadora:
//   - Só processa <img> com src reconhecido pela Media Library
//   - <img> externas (http/https/data:) passam sem modificação
//   - Não remove nem altera nenhum atributo existente
//   - Não quebra HTML com aninhamentos complexos
// ──────────────────────────────────────────────

import type { MediaItem } from "@/data/mediaTypes";
import { VARIANT_WIDTHS } from "@/data/mediaTypes";
import { getMediaBaseDir } from "@/components/OptimizedImage";

// ──────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────

/** sizes responsivo padrão para imagens dentro do conteúdo de posts */
const CONTENT_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 85vw, 720px";

/** Variantes ordenadas para srcset */
const SRCSET_VARIANTS = ["thumbnail", "medium", "large"] as const;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Constrói o srcset a partir do diretório base da mídia.
 */
function buildSrcSet(baseDir: string): string {
  return SRCSET_VARIANTS.map(
    (v) => `${baseDir}/${v}.webp ${VARIANT_WIDTHS[v]}w`
  ).join(", ");
}

/**
 * Extrai o valor de um atributo HTML de uma tag <img>.
 * Ex: extractAttr('<img src="/foo.jpg" alt="x">', 'src') → '/foo.jpg'
 */
function extractAttr(tag: string, attr: string): string | null {
  const re = new RegExp(`${attr}=["']([^"']*)["']`, "i");
  const m = tag.match(re);
  return m ? m[1] : null;
}

/**
 * Injeta ou sobrescreve atributos em uma tag <img>.
 * Se o atributo já existir, substitui. Se não, adiciona antes do ">".
 */
function setAttrs(tag: string, attrs: Record<string, string>): string {
  let result = tag;
  for (const [key, value] of Object.entries(attrs)) {
    const attrRe = new RegExp(`\\s${key}=["'][^"']*["']`, "i");
    if (attrRe.test(result)) {
      result = result.replace(attrRe, ` ${key}="${value}"`);
    } else {
      // Insere antes do fechamento da tag (> ou />)
      result = result.replace(/\s?\/?>\s*$/, ` ${key}="${value}">`);
    }
  }
  return result;
}

// ──────────────────────────────────────────────
// Função principal
// ──────────────────────────────────────────────

/**
 * Processa o HTML de conteúdo e enriquece <img> da Media Library
 * com srcset, sizes, loading e decoding.
 *
 * @param html        HTML cru do campo content do post
 * @param mediaItems  Lista de MediaItems para lookup de width/height
 * @returns           HTML com <img> otimizadas (Media Library) e
 *                    <img> externas intocadas
 */
export function enrichContentImages(
  html: string,
  mediaItems: MediaItem[]
): string {
  if (!html || !html.includes("<img")) return html;

  // Mapa rápido: paths.large → MediaItem (para lookup de dimensões)
  const mediaMap = new Map<string, MediaItem>(
    mediaItems.flatMap((item) => [
      [item.paths.large,     item],
      [item.paths.medium,    item],
      [item.paths.thumbnail, item],
      [item.paths.original,  item],
    ])
  );

  // Regex para capturar cada tag <img ...> (incluindo self-closing)
  return html.replace(/<img\b[^>]*\/?>/gi, (tag) => {
    const src = extractAttr(tag, "src");
    if (!src) return tag;

    // Ignora imagens externas (http, https, data:, //)
    if (/^(https?:\/\/|data:|\/\/)/.test(src)) return tag;

    // Detecta se é caminho da Media Library
    const baseDir = getMediaBaseDir(src);
    if (!baseDir) return tag;

    // Busca dimensões no catálogo (para evitar CLS)
    const mediaItem = mediaMap.get(src);
    const dimensionAttrs: Record<string, string> = {};
    if (mediaItem) {
      if (mediaItem.width)  dimensionAttrs["width"]  = String(mediaItem.width);
      if (mediaItem.height) dimensionAttrs["height"] = String(mediaItem.height);
    }

    return setAttrs(tag, {
      src:      `${baseDir}/large.webp`,
      srcset:   buildSrcSet(baseDir),
      sizes:    CONTENT_SIZES,
      loading:  "lazy",
      decoding: "async",
      ...dimensionAttrs,
    });
  });
}
