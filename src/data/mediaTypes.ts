// ──────────────────────────────────────────────
// Media Library — Tipos e Interfaces
// ──────────────────────────────────────────────

/**
 * Caminhos das variantes otimizadas de uma imagem.
 * Cada upload gera 4 arquivos físicos.
 */
export interface MediaPaths {
  /** ~300px largura, qualidade 0.7 — usado em grids e cards */
  thumbnail: string;
  /** ~800px largura, qualidade 0.8 — usado no corpo de posts */
  medium: string;
  /** ~1920px largura, qualidade 0.85 — usado como imagem destacada */
  large: string;
  /** Arquivo original sem modificação (backup) */
  original: string;
}

/**
 * Origem da mídia — de onde veio o upload.
 */
export type MediaSourceType = "post" | "page" | "standalone";

/**
 * Item individual da biblioteca de mídia.
 * Cada entrada corresponde a 1 upload (com múltiplas variantes).
 */
export interface MediaItem {
  /** UUID único (gerado no momento do upload) */
  id: string;
  /** Nome original do arquivo enviado (ex: "foto-loja.jpg") */
  name: string;
  /** Texto alternativo para acessibilidade (editável pelo admin) */
  alt: string;
  /** Caminhos públicos das variantes otimizadas */
  paths: MediaPaths;
  /** Largura da imagem original em pixels */
  width: number;
  /** Altura da imagem original em pixels */
  height: number;
  /** Tamanho do arquivo original em bytes */
  size: number;
  /** MIME type do arquivo original (ex: "image/jpeg") */
  mimeType: string;
  /** Data/hora do upload (ISO 8601) */
  uploadedAt: string;
  /** Tipo da origem: post, page ou standalone */
  sourceType: MediaSourceType;
  /** ID/slug da origem (ex: slug do post). Vazio se standalone */
  sourceId: string;
  /** Placeholder blur tiny (~20px) como data-uri, para loading progressivo */
  blurDataUrl?: string;
}

// ──────────────────────────────────────────────
// MediaSelectedInfo — Retorno padronizado para consumidores
// ──────────────────────────────────────────────

/**
 * Objeto retornado ao consumidor quando uma mídia é selecionada.
 * Desacoplado do MediaItem completo — contém apenas o que o
 * consumidor precisa para usar a imagem, sem detalhes internos
 * como mimeType, size, uploadedAt, sourceType, etc.
 */
export interface MediaSelectedInfo {
  /** UUID da mídia */
  id: string;
  /** URL principal (paths.large por padrão) — pronta para uso direto */
  url: string;
  /** URL do thumbnail (~300px) — para previews compactos */
  thumbnail: string;
  /** Largura da imagem original em pixels */
  width: number;
  /** Altura da imagem original em pixels */
  height: number;
  /** Texto alternativo para acessibilidade */
  alt: string;
  /** Caminhos completos das variantes (para casos que precisem de controle fino) */
  paths: MediaPaths;
}

/**
 * Converte um MediaItem completo em MediaSelectedInfo.
 * Usa paths.large como URL principal — bom equilíbrio qualidade/peso.
 */
export function toMediaSelectedInfo(item: MediaItem): MediaSelectedInfo {
  return {
    id: item.id,
    url: item.paths.large,
    thumbnail: item.paths.thumbnail,
    width: item.width,
    height: item.height,
    alt: item.alt || "",
    paths: item.paths,
  };
}

// ──────────────────────────────────────────────
// Configuração de upload
// ──────────────────────────────────────────────

/** Opções passadas ao adapter durante o upload */
export interface UploadOptions {
  /** Texto alternativo inicial */
  alt?: string;
  /** Tipo de origem */
  sourceType?: MediaSourceType;
  /** ID/slug da origem */
  sourceId?: string;
}

/** Resultado de validação antes do upload */
export interface MediaValidation {
  valid: boolean;
  error?: string;
}

// ──────────────────────────────────────────────
// Constantes de configuração
// ──────────────────────────────────────────────

/** Tipos MIME aceitos para upload */
export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
] as const;

/** Extensões aceitas (para input accept) */
export const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif,.avif,.svg";

/** Tamanho máximo de arquivo em bytes (10MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Larguras das variantes geradas */
export const VARIANT_WIDTHS = {
  thumbnail: 300,
  medium: 800,
  large: 1920,
} as const;

/** Qualidade WebP por variante (0-1) */
export const VARIANT_QUALITY = {
  thumbnail: 0.7,
  medium: 0.8,
  large: 0.85,
} as const;

/** Caminho base das mídias no /public */
export const MEDIA_PUBLIC_DIR = "media";

/** Caminho do catálogo JSON */
export const MEDIA_CATALOG_PATH = "/data/media-library.json";

// ──────────────────────────────────────────────
// Estratégia de Cache / Versionamento
// ──────────────────────────────────────────────
//
// As imagens da Media Library são imutáveis por design:
//   - Cada upload gera um UUID único no path: /media/{year}/{month}/{uuid}/
//   - Re-upload de uma imagem cria um novo UUID (novo path)
//   - Editar um post para trocar imagem muda o path no JSON
//
// Isso permite cache agressivo (immutable) nos arquivos de mídia:
//   Cache-Control: public, max-age=31536000, immutable
//
// O catálogo (media-library.json) NÃO é imutável e deve ter:
//   Cache-Control: public, max-age=60, stale-while-revalidate=300
//
// Para deploy estático (Netlify, Vercel, etc), adicione no _headers:
//   /media/*
//     Cache-Control: public, max-age=31536000, immutable
//   /data/media-library.json
//     Cache-Control: public, max-age=60, stale-while-revalidate=300
// ──────────────────────────────────────────────

/** Cache-Control recomendado para arquivos de mídia (imutáveis) */
export const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

/** Cache-Control recomendado para o catálogo JSON (dinâmico) */
export const CATALOG_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

// ──────────────────────────────────────────────
// Storage Adapter — Interface
// ──────────────────────────────────────────────

/**
 * Contrato que todo adapter de storage deve implementar.
 *
 * Adapters disponíveis:
 * - LocalDevAdapter:  Vite Plugin (npm run dev)
 * - ManualAdapter:    Fallback para produção estática
 * - SupabaseAdapter:  Storage externo (opcional)
 */
export interface MediaStorageAdapter {
  /** Identificador legível do adapter (ex: "local-dev", "manual", "supabase") */
  readonly name: string;

  /** Indica se este adapter suporta upload automático (sem intervenção manual) */
  readonly supportsAutoUpload: boolean;

  /** Verifica se o adapter está disponível no ambiente atual */
  isAvailable(): boolean;

  /** Envia arquivo e retorna o MediaItem completo com todas as variantes */
  upload(file: File, options?: UploadOptions): Promise<MediaItem>;

  /** Remove uma mídia (arquivos + entrada no catálogo) */
  delete(id: string): Promise<void>;

  /** Lista todas as mídias do catálogo */
  list(): Promise<MediaItem[]>;
}

// ──────────────────────────────────────────────
// Catálogo JSON — Formato do arquivo
// ──────────────────────────────────────────────

/** Formato do /public/data/media-library.json */
export interface MediaCatalog {
  version: number;
  updatedAt: string;
  items: MediaItem[];
}

export const MEDIA_CATALOG_VERSION = 1;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Valida se um arquivo é aceito para upload */
export function validateMediaFile(file: File): MediaValidation {
  if (!ACCEPTED_MIME_TYPES.includes(file.type as typeof ACCEPTED_MIME_TYPES[number])) {
    return {
      valid: false,
      error: `Tipo "${file.type || "desconhecido"}" não é aceito. Use: JPG, PNG, WebP, GIF, AVIF ou SVG.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const limitMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `Arquivo muito grande (${sizeMB}MB). Limite: ${limitMB}MB.`,
    };
  }

  return { valid: true };
}

/** Gera um UUID v4 simples */
export function generateMediaId(): string {
  return crypto.randomUUID();
}

/**
 * Gera o caminho de diretório para uma mídia: media/{ano}/{mes}/{id}
 * Cada mídia tem sua própria pasta, eliminando risco de conflito de nomes.
 */
export function getMediaDir(id: string, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${MEDIA_PUBLIC_DIR}/${year}/${month}/${id}`;
}

/**
 * Gera nome de arquivo para uma variante.
 * Formato: {variante}.webp (ex: thumbnail.webp, medium.webp)
 * O original mantém a extensão real: original.{ext}
 */
export function getMediaFileName(variant: keyof MediaPaths, ext?: string): string {
  if (variant === "original") {
    return `original.${ext || "jpg"}`;
  }
  return `${variant}.webp`;
}
