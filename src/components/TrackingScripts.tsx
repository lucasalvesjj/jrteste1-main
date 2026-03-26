/**
 * TrackingScripts.tsx
 * Lê os tracking codes do localStorage e injeta os scripts
 * nas posições corretas (head via Helmet, body via dangerouslySetInnerHTML).
 *
 * Respeita:
 *  - tc.enabled        → só injeta se ativo
 *  - tc.scope/paths    → filtra por pathname atual
 *  - tc.position       → head | body_start | body_end
 */

import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { getTrackingCodes } from "./admin/AdminSeoEditor";
import type { TrackingCode } from "./admin/AdminSeoEditor";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Verifica se o pathname atual deve executar o tracking code */
function shouldInject(tc: TrackingCode, pathname: string): boolean {
  if (!tc.enabled) return false;

  if (tc.scope === "specific") {
    // Inclui apenas as páginas listadas
    return tc.includedPaths.some((p) => pathname === p || pathname.startsWith(p));
  }

  // Global: injeta em tudo exceto páginas excluídas
  return !tc.excludedPaths.some((p) => pathname === p || pathname.startsWith(p));
}

/** Sanitiza o código para injeção via dangerouslySetInnerHTML (body) */
function extractInlineScript(code: string): string {
  // Remove tags <script ...> e </script> externas para innerHTML
  return code
    .replace(/<script[^>]*>/gi, "")
    .replace(/<\/script>/gi, "")
    .trim();
}

/** Detecta se o código é um <script src=...> externo */
function extractScriptSrc(code: string): string | null {
  const match = code.match(/<script[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

/** Detecta atributos do script tag (async, defer, etc) */
function isAsync(code: string): boolean {
  return /\basync\b/i.test(code);
}
function isDefer(code: string): boolean {
  return /\bdefer\b/i.test(code);
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function TrackingScripts() {
  const location = useLocation();
  const pathname = location.pathname;

  // Re-lê do localStorage a cada navegação (SPA)
  const [codes, setCodes] = useState<TrackingCode[]>([]);

  useEffect(() => {
    setCodes(getTrackingCodes());
  }, [pathname]);

  const active = useMemo(() => {
    // 1. Filtra por página atual
    const filtered = codes.filter((tc) => shouldInject(tc, pathname));
    // 2. Ordena pelo campo `order` (menor = primeiro injetado)
    //    Fallback para índice 0 em codes antigos sem campo order
    return [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [codes, pathname]);

  const headCodes    = active.filter((tc) => tc.position === "head");
  const bodyStart    = active.filter((tc) => tc.position === "body_start");
  const bodyEnd      = active.filter((tc) => tc.position === "body_end");

  return (
    <>
      {/* ── HEAD scripts via react-helmet-async ── */}
      {headCodes.length > 0 && (
        <Helmet>
          {headCodes.map((tc) => {
            const src = extractScriptSrc(tc.code);
            if (src) {
              // Script externo com src=
              return (
                <script
                  key={tc.id}
                  src={src}
                  async={isAsync(tc.code) || undefined}
                  defer={isDefer(tc.code) || undefined}
                />
              );
            }
            // Script inline
            return (
              <script key={tc.id}>
                {extractInlineScript(tc.code)}
              </script>
            );
          })}
        </Helmet>
      )}

      {/* ── BODY START scripts ── */}
      {bodyStart.map((tc) => (
        <div
          key={tc.id}
          style={{ display: "none" }}
          data-tracking={tc.id}
          dangerouslySetInnerHTML={{ __html: tc.code }}
        />
      ))}

      {/* ── BODY END scripts ── */}
      {bodyEnd.map((tc) => (
        <div
          key={tc.id}
          style={{ display: "none" }}
          data-tracking={tc.id}
          dangerouslySetInnerHTML={{ __html: tc.code }}
        />
      ))}
    </>
  );
}
