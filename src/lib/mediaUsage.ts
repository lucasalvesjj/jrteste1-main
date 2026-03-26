// ──────────────────────────────────────────────
// mediaUsage — Utilitário de uso de mídias
// ──────────────────────────────────────────────
// Dado um MediaItem, retorna onde ele está sendo usado
// com base nos campos sourceType e sourceId.
//
// Estratégia: sourceType/sourceId (origem do upload).
// Para posts: cruza sourceId com slugs do blogStore.
// Para páginas: mapeia sourceId para rótulo legível.
// Para standalone: sem vínculo de origem.
// ──────────────────────────────────────────────

import type { MediaItem, MediaSourceType } from "@/data/mediaTypes";

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

export type MediaUsageStatus = "post" | "page" | "standalone" | "unused";

export interface MediaUsageInfo {
  status: MediaUsageStatus;
  /** Rótulo legível (ex: título do post, nome da página) */
  label: string;
  /** Link interno navegável (ex: /admin?edit=slug) — opcional */
  link?: string;
}

// ──────────────────────────────────────────────
// Mapa de páginas do sistema
// (sourceId usado no upload → rótulo legível)
// ──────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  "home":               "Página Inicial",
  "index":              "Página Inicial",
  "nossa-historia":     "Nossa História",
  "nossa-missao":       "Nossa Missão",
  "segmentos":          "Segmentos",
  "irrigacao":          "Irrigação",
  "ferramentas":        "Ferramentas",
  "maquinas":           "Máquinas",
  "bombas-motores":     "Bombas e Motores",
  "locacao":            "Locação",
  "pocos-artesianos":   "Poços Artesianos",
  "assistencia-stihl":  "Assistência STIHL",
  "contato":            "Contato",
  "blog":               "Blog",
  "politica-privacidade": "Política de Privacidade",
};

// ──────────────────────────────────────────────
// Função principal
// ──────────────────────────────────────────────

/**
 * Retorna informações de uso de um MediaItem.
 *
 * @param item        O MediaItem a ser verificado
 * @param postTitles  Mapa de slug → título dos posts (do blogStore)
 *                    Opcional — se não fornecido, usa o sourceId como label
 */
export function getMediaUsage(
  item: MediaItem,
  postTitles?: Record<string, string>
): MediaUsageInfo {
  const { sourceType, sourceId } = item;

  // ── Sem tipo de origem → sem uso detectado ──
  if (!sourceType || !sourceId) {
    return { status: "unused", label: "Sem uso detectado" };
  }

  // ── Origem: post ──
  if (sourceType === "post") {
    const title = postTitles?.[sourceId] ?? sourceId;
    return {
      status: "post",
      label: title,
      link: `/admin?edit=${sourceId}`,
    };
  }

  // ── Origem: página ──
  if (sourceType === "page") {
    const label = PAGE_LABELS[sourceId] ?? sourceId;
    return {
      status: "page",
      label,
    };
  }

  // ── Origem: standalone (avulsa) ──
  if (sourceType === "standalone") {
    return {
      status: "standalone",
      label: "Imagem avulsa (sem vínculo de página)",
    };
  }

  return { status: "unused", label: "Sem uso detectado" };
}

// ──────────────────────────────────────────────
// Helper: monta o mapa slug → título a partir
// de um array de posts do blogStore
// ──────────────────────────────────────────────

export function buildPostTitleMap(
  posts: Array<{ slug: string; title: string }>
): Record<string, string> {
  return Object.fromEntries(posts.map((p) => [p.slug, p.title]));
}
