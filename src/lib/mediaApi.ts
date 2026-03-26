// ──────────────────────────────────────────────
// Media API — Facade com seleção automática de adapter
// ──────────────────────────────────────────────
// Este arquivo é o ÚNICO ponto de contato entre os componentes
// de UI e o storage de mídia. Nenhum componente importa adapters
// diretamente — todos usam as funções exportadas aqui.
//
// Seleção automática:
//  1. import.meta.env.DEV          → LocalDevAdapter  (Vite Plugin)
//  2. VITE_SUPABASE_URL definida   → SupabaseAdapter   (dinâmico)
//  3. fallback                     → ManualAdapter     (sempre funciona)
// ──────────────────────────────────────────────

import type {
  MediaItem,
  MediaStorageAdapter,
  UploadOptions,
} from "@/data/mediaTypes";
import { localDevAdapter } from "@/lib/adapters/localDevAdapter";
import { manualAdapter } from "@/lib/adapters/manualAdapter";

// ──────────────────────────────────────────────
// Seleção do adapter ativo
// ──────────────────────────────────────────────

let _activeAdapter: MediaStorageAdapter | null = null;

/**
 * Resolve o adapter ativo baseado no ambiente.
 * Carrega adapters externos (Supabase) via dynamic import para
 * não poluir o bundle quando não estão em uso.
 */
async function resolveAdapter(): Promise<MediaStorageAdapter> {
  if (_activeAdapter) return _activeAdapter;

  // 1. Em desenvolvimento, usar o Vite Plugin (upload para /public/media/)
  if (localDevAdapter.isAvailable()) {
    _activeAdapter = localDevAdapter;
    console.info("[MediaAPI] Adapter selecionado: local-dev (Vite Plugin)");
    return _activeAdapter;
  }

  // 2. Se Supabase está configurado, carregar dinamicamente
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const { supabaseAdapter } = await import("@/lib/adapters/supabaseAdapter");
      if (supabaseAdapter.isAvailable()) {
        _activeAdapter = supabaseAdapter;
        console.info("[MediaAPI] Adapter selecionado: supabase");
        return _activeAdapter;
      }
    } catch (err) {
      console.warn("[MediaAPI] Supabase adapter não carregou:", err);
    }
  }

  // 3. Fallback: modo manual (sempre funciona)
  _activeAdapter = manualAdapter;

  // ── Aviso crítico: manual em DEV indica falha no Vite Plugin ──
  if (import.meta.env.DEV) {
    console.error(
      "[MediaAPI] ⚠️ ATENÇÃO: ManualAdapter ativado em ambiente DEV. " +
      "Isso causará downloads de arquivo ao fazer upload. " +
      "Verifique se o Vite Plugin de upload está ativo e se o Sharp está instalado."
    );
  } else {
    console.info("[MediaAPI] Adapter selecionado: manual (produção estática)");
  }

  return _activeAdapter;
}

/**
 * Retorna o adapter ativo (sync, após inicialização).
 * Usar após chamar initMediaApi() ou qualquer operação.
 */
export function getActiveAdapter(): MediaStorageAdapter | null {
  return _activeAdapter;
}

/**
 * Força re-seleção do adapter (útil se variáveis de ambiente mudarem).
 */
export function resetAdapter(): void {
  _activeAdapter = null;
}

// ──────────────────────────────────────────────
// API pública — usada por todos os componentes
// ──────────────────────────────────────────────

/**
 * Inicializa a Media API e resolve o adapter.
 * Chamar uma vez no início do admin.
 */
export async function initMediaApi(): Promise<void> {
  const adapter = await resolveAdapter();
  console.info(`[MediaAPI] Adapter ativo: ${adapter.name} (autoUpload: ${adapter.supportsAutoUpload})`);
}

/**
 * Faz upload de um arquivo de mídia.
 * O adapter ativo cuida de processar, otimizar e armazenar.
 */
export async function uploadMedia(
  file: File,
  options?: UploadOptions
): Promise<MediaItem> {
  const adapter = await resolveAdapter();
  return adapter.upload(file, options);
}

/**
 * Remove uma mídia do storage.
 */
export async function deleteMedia(id: string): Promise<void> {
  const adapter = await resolveAdapter();
  return adapter.delete(id);
}

/**
 * Lista todas as mídias do catálogo.
 */
export async function listMedia(): Promise<MediaItem[]> {
  const adapter = await resolveAdapter();
  return adapter.list();
}

/**
 * Verifica se o adapter atual suporta upload automático.
 * Usado pela UI para decidir entre "Enviar" e "Processar e baixar".
 */
export async function supportsAutoUpload(): Promise<boolean> {
  const adapter = await resolveAdapter();
  return adapter.supportsAutoUpload;
}

/**
 * Retorna o nome do adapter ativo para exibir na UI.
 */
export async function getAdapterName(): Promise<string> {
  const adapter = await resolveAdapter();
  return adapter.name;
}

/**
 * Atualiza o campo `alt` de uma mídia no catálogo.
 * Lê o JSON local, faz o patch e grava de volta.
 * Em produção (ManualAdapter) persiste no localStorage como fallback.
 */
export async function updateMediaAlt(id: string, alt: string): Promise<void> {
  // Fallback universal: persiste no localStorage sob a chave "media-alt-overrides"
  try {
    const raw = localStorage.getItem("media-alt-overrides") || "{}";
    const overrides = JSON.parse(raw) as Record<string, string>;
    overrides[id] = alt;
    localStorage.setItem("media-alt-overrides", JSON.stringify(overrides));
  } catch {
    // silencia erros de localStorage
  }
}

/**
 * Lê o alt de uma mídia considerando overrides do localStorage.
 */
export function getMediaAltOverride(id: string): string | null {
  try {
    const raw = localStorage.getItem("media-alt-overrides") || "{}";
    const overrides = JSON.parse(raw) as Record<string, string>;
    return overrides[id] ?? null;
  } catch {
    return null;
  }
}
