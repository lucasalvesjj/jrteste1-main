/**
 * TrackingScripts.tsx
 * Lê os tracking codes do JSON publicado e injeta os scripts
 * nas posições corretas (head via Helmet, body via dangerouslySetInnerHTML).
 *
 * Respeita:
 *  - tc.enabled        → só injeta se ativo
 *  - tc.scope/paths    → filtra por pathname atual
 *  - tc.position       → head | body_start | body_end
 *
 * Cada tracking code pode conter múltiplos blocos <script> (ex: GA4
 * tem um script externo + inline de configuração). Todos são injetados.
 */

import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import type { TrackingCode } from "@/types/tracking";

const TRACKING_JSON_PATH = "/data/tracking-codes.json";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Verifica se o pathname atual deve executar o tracking code */
function shouldInject(tc: TrackingCode, pathname: string): boolean {
  if (!tc.enabled) return false;

  if (tc.scope === "specific") {
    return tc.includedPaths.some((p) => pathname === p || pathname.startsWith(p));
  }

  return !tc.excludedPaths.some((p) => pathname === p || pathname.startsWith(p));
}

interface ScriptBlock {
  type: "external" | "inline";
  src?: string;
  content?: string;
  async?: boolean;
  defer?: boolean;
}

/** Extrai TODOS os blocos <script> de um tracking code HTML */
function parseScriptBlocks(code: string): ScriptBlock[] {
  const blocks: ScriptBlock[] = [];
  const regex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const attrs = match[1];
    const content = match[2].trim();
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      blocks.push({
        type: "external",
        src: srcMatch[1],
        async: /\basync\b/i.test(attrs),
        defer: /\bdefer\b/i.test(attrs),
      });
    } else if (content) {
      blocks.push({ type: "inline", content });
    }
  }
  return blocks;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function TrackingScripts() {
  const location = useLocation();
  const pathname = location.pathname;

  // Re-lê do JSON publicado a cada navegação (SPA)
  const [codes, setCodes] = useState<TrackingCode[]>([]);

  useEffect(() => {
    fetch(TRACKING_JSON_PATH, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        setCodes(Array.isArray(data) ? (data as TrackingCode[]) : []);
      })
      .catch(() => setCodes([]));
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
          {headCodes.flatMap((tc) => {
            const blocks = parseScriptBlocks(tc.code);
            return blocks.map((block, i) =>
              block.type === "external" ? (
                <script
                  key={`${tc.id}-${i}`}
                  src={block.src}
                  async={block.async || undefined}
                  defer={block.defer || undefined}
                />
              ) : (
                <script key={`${tc.id}-${i}`}>{block.content}</script>
              )
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
