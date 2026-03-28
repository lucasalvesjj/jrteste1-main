-- ──────────────────────────────────────────────────────────────
-- Supabase Storage — Setup do bucket "media"
-- Execute este SQL no Supabase: Dashboard → SQL Editor → New query
-- ──────────────────────────────────────────────────────────────

-- 1. Cria o bucket "media" como público (se ainda não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760,  -- 10MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/avif', 'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- 2. Política: qualquer um pode VER as imagens (leitura pública)
DROP POLICY IF EXISTS "Leitura pública" ON storage.objects;
CREATE POLICY "Leitura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- 3. Política: qualquer um pode fazer UPLOAD (sem autenticação)
--    Necessário porque o admin do site não usa auth do Supabase
DROP POLICY IF EXISTS "Upload público via anon key" ON storage.objects;
CREATE POLICY "Upload público via anon key"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media');

-- 4. Política: qualquer um pode DELETAR (via anon key do admin)
DROP POLICY IF EXISTS "Delete público via anon key" ON storage.objects;
CREATE POLICY "Delete público via anon key"
ON storage.objects FOR DELETE
USING (bucket_id = 'media');

-- 5. Política: qualquer um pode ATUALIZAR (upsert de variantes)
DROP POLICY IF EXISTS "Update público via anon key" ON storage.objects;
CREATE POLICY "Update público via anon key"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media');
