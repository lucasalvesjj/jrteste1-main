// ──────────────────────────────────────────────
// supabaseConfig.ts — Configuração do Supabase
// ──────────────────────────────────────────────
// A anon/publishable key é segura para ficar no frontend.
// É uma chave pública por design — o Supabase a chama de
// "publishable key" exatamente por isso.
// O controle de acesso real é feito pelas políticas RLS
// configuradas no painel do Supabase.
// ──────────────────────────────────────────────

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.split("|")[0]
  || "https://jrpxyjjeuuohdgyhuifv.supabase.co";

export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  || "sb_publishable_54ICHh8oXH-_lmVynx2myQ_JIS4w7e9";
