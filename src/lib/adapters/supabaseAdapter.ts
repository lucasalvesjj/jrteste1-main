// ──────────────────────────────────────────────
// SupabaseAdapter — Storage externo (OPCIONAL)
// ──────────────────────────────────────────────
// Ativado automaticamente quando as variáveis de ambiente
// VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas.
//
// Setup:
//  1. Criar conta em supabase.com (grátis até 1GB)
//  2. Criar bucket público "media" no Storage
//  3. Adicionar ao .env:
//     VITE_SUPABASE_URL=https://xxxx.supabase.co
//     VITE_SUPABASE_ANON_KEY=eyJhbGci...
//
// Este arquivo é carregado via dynamic import em mediaApi.ts
// e NÃO entra no bundle se não estiver em uso.
// ──────────────────────────────────────────────

import type {
  MediaItem,
  MediaStorageAdapter,
  UploadOptions,
} from "@/data/mediaTypes";

export const supabaseAdapter: MediaStorageAdapter = {
  name: "supabase",
  supportsAutoUpload: true,

  isAvailable(): boolean {
    return !!(
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  },

  async upload(_file: File, _options?: UploadOptions): Promise<MediaItem> {
    // TODO: Implementar quando Supabase for configurado
    // 1. Processar imagem client-side (resizeToWebP do manualAdapter)
    // 2. Upload para supabase.storage.from('media').upload()
    // 3. Obter URLs públicas do CDN
    // 4. Retornar MediaItem com paths apontando para o CDN
    throw new Error(
      "[SupabaseAdapter] Ainda não implementado. " +
      "Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY " +
      "e implemente este adapter quando necessário."
    );
  },

  async delete(_id: string): Promise<void> {
    // TODO: supabase.storage.from('media').remove([paths])
    throw new Error("[SupabaseAdapter] Ainda não implementado.");
  },

  async list(): Promise<MediaItem[]> {
    // Lista do mesmo media-library.json (pode ser servido pelo Supabase
    // ou mantido localmente — a decisão fica para a implementação futura)
    try {
      const response = await fetch("/data/media-library.json", { cache: "no-store" });
      if (!response.ok) return [];
      const catalog = await response.json();
      return catalog?.items ?? [];
    } catch {
      return [];
    }
  },
};
