// ──────────────────────────────────────────────
// OptimizedImage — Componente de imagem otimizada
// ──────────────────────────────────────────────
// Renderiza imagens da Media Library com:
//  - srcSet responsivo (thumbnail 300w, medium 800w, large 1920w)
//  - Presets de sizes responsivos por contexto
//  - width/height intrínsecos para evitar layout shift (CLS)
//  - loading="lazy" nativo
//  - Blur placeholder com fade-in ao carregar
//  - Cache-busting via query param ?v={timestamp}
//  - Fallback transparente para imagens legadas
//
// Uso:
//   <OptimizedImage
//     src={post.image}
//     alt={post.title}
//     preset="card"
//     width={800} height={450}
//   />
// ──────────────────────────────────────────────

import { memo, useCallback, useState } from "react";
import { VARIANT_WIDTHS } from "@/data/mediaTypes";

// ──────────────────────────────────────────────
// Presets de sizes responsivos
// ──────────────────────────────────────────────

/**
 * Presets pré-definidos para diferentes contextos de layout.
 * Cada preset mapeia breakpoints para a largura que a imagem
 * realmente ocupa naquele viewport, guiando o browser a baixar
 * o variante correto.
 */
const SIZES_PRESETS = {
  /** Card de blog em grid (1-3 colunas responsivo) */
  card: "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 400px",

  /** Imagem destacada de post (full-width mobile, contida em desktop) */
  hero: "(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 768px",

  /** Imagem inline no conteúdo do post */
  content: "(max-width: 640px) 100vw, (max-width: 1024px) 85vw, 720px",

  /** Thumbnail pequeno (sidebar, related, etc) */
  thumb: "(max-width: 640px) 50vw, 200px",

  /** Full-width em qualquer viewport */
  full: "100vw",
} as const;

export type ImageSizePreset = keyof typeof SIZES_PRESETS;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Regex para detectar paths da Media Library: /media/{year}/{month}/{uuid}/{variant}.webp */
const MEDIA_LIBRARY_PATH_RE = /^\/media\/\d{4}\/\d{2}\/[a-f0-9-]+\/(thumbnail|medium|large|original)\.\w+$/;

/** Variantes ordenadas por largura para srcSet */
const SRCSET_VARIANTS = ["thumbnail", "medium", "large"] as const;

/**
 * Verifica se um src é um path da Media Library.
 * Retorna o diretório base se sim, null se não.
 */
function getMediaBaseDir(src: string): string | null {
  if (!src || !src.startsWith("/media/")) return null;
  const match = src.match(MEDIA_LIBRARY_PATH_RE);
  if (!match) return null;
  const lastSlash = src.lastIndexOf("/");
  return src.substring(0, lastSlash);
}

/**
 * Gera o srcSet a partir do diretório base da mídia.
 * Inclui cache-buster se fornecido.
 */
function buildSrcSet(baseDir: string, cacheBuster?: string): string {
  const suffix = cacheBuster ? `?v=${cacheBuster}` : "";
  return SRCSET_VARIANTS.map(
    (variant) => `${baseDir}/${variant}.webp${suffix} ${VARIANT_WIDTHS[variant]}w`
  ).join(", ");
}

/**
 * Calcula a aspect ratio como padding-bottom para reservar espaço.
 * Usado apenas quando width/height são fornecidos.
 */
function getAspectRatioStyle(width?: number, height?: number): React.CSSProperties | undefined {
  if (!width || !height) return undefined;
  return { aspectRatio: `${width} / ${height}` };
}

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

interface OptimizedImageProps {
  /** Caminho da imagem (pode ser path da Media Library ou qualquer URL/base64) */
  src: string;
  /** Texto alternativo — sempre obrigatório para SEO e acessibilidade */
  alt: string;
  /** Título opcional da imagem (tooltip + reforço semântico) */
  title?: string;
  /** Classes CSS no container */
  className?: string;
  /** Largura original da imagem em px (da MediaItem.width) */
  width?: number;
  /** Altura original da imagem em px (da MediaItem.height) */
  height?: number;
  /** Blur placeholder data-URI (da MediaItem.blurDataUrl) */
  blurDataUrl?: string;
  /** Preset de sizes responsivo (recomendado em vez de sizes manual) */
  preset?: ImageSizePreset;
  /** Hint de sizes manual (sobrescreve preset se ambos fornecidos) */
  sizes?: string;
  /** Se deve usar loading="eager" em vez de "lazy" (above-the-fold) */
  priority?: boolean;
  /** loading="lazy" | "eager" — sobrescreve priority se ambos informados */
  loading?: "lazy" | "eager";
  /** decoding="async" | "sync" | "auto" */
  decoding?: "async" | "sync" | "auto";
  /**
   * Cache-buster: string anexada como ?v={value} nos URLs.
   * Usar o uploadedAt do MediaItem para invalidar cache após re-upload.
   * Se não fornecido, não adiciona query param.
   */
  cacheBuster?: string;
  /** Callback quando imagem carrega com sucesso */
  onLoad?: () => void;
  /** Callback quando imagem falha */
  onError?: () => void;
}

// ──────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  title,
  className = "",
  width,
  height,
  blurDataUrl,
  preset = "content",
  sizes: sizesProp,
  priority = false,
  loading: loadingProp,
  decoding: decodingProp = "async",
  cacheBuster,
  onLoad: onLoadProp,
  onError: onErrorProp,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoadProp?.();
  }, [onLoadProp]);

  const handleError = useCallback(() => {
    setError(true);
    setLoaded(true);
    onErrorProp?.();
  }, [onErrorProp]);

  // Detecta se é um path da Media Library
  const baseDir = getMediaBaseDir(src);
  const isMediaLibrary = baseDir !== null;
  const srcSet = isMediaLibrary ? buildSrcSet(baseDir, cacheBuster) : undefined;

  // Resolve sizes: prop manual > preset > default
  const resolvedSizes = sizesProp || SIZES_PRESETS[preset];

  // URL principal com cache-buster opcional
  const cacheSuffix = cacheBuster ? `?v=${cacheBuster}` : "";
  const mainSrc = isMediaLibrary
    ? `${baseDir}/large.webp${cacheSuffix}`
    : src;

  // Estilo para reservar espaço (prevenir CLS)
  const aspectStyle = getAspectRatioStyle(width, height);

  if (!src) return null;

  // Erro: placeholder visual
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
        style={aspectStyle}
        role="img"
        aria-label={alt}
      >
        <svg className="h-8 w-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={aspectStyle}>
      {/* Blur placeholder */}
      {blurDataUrl && !loaded && (
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-lg"
        />
      )}

      {/* Imagem principal */}
      <img
        src={mainSrc}
        srcSet={srcSet}
        sizes={srcSet ? resolvedSizes : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={loadingProp ?? (priority ? "eager" : "lazy")}
        decoding={decodingProp ?? (priority ? "sync" : "async")}
        title={title}
        onLoad={handleLoad}
        onError={handleError}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          blurDataUrl && !loaded ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
});

export default OptimizedImage;

// ──────────────────────────────────────────────
// Re-exportações para uso externo
// ──────────────────────────────────────────────

export { SIZES_PRESETS, getMediaBaseDir };
