// ──────────────────────────────────────────────
// supabaseConfig.ts — Configuração do Supabase
// ──────────────────────────────────────────────
// A anon/public key é segura no frontend — é pública por design.
// O controle de acesso real são as políticas RLS no Supabase.
// ──────────────────────────────────────────────

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://jrpxyjjeuuohdgyhuifv.supabase.co";

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpycHh5ampldXVvaGRneWh1aWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTUwMzYsImV4cCI6MjA5MDE5MTAzNn0.ooUU3cLKoe92eTph5PCEdv-3O_XAnZmr3i0RE3T-LBk";
