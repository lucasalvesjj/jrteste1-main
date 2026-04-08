#!/usr/bin/env node
/**
 * Processa imagens estáticas (hero, logo, favicon) pelo pipeline Sharp,
 * gera variantes WebP otimizadas e indexa no media-library.json.
 *
 * Uso:
 *   node scripts/process-static-images.mjs
 *   node scripts/process-static-images.mjs --dry-run
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CATALOG_PATH = path.join(PUBLIC_DIR, 'data', 'media-library.json');

// Mesma config do vite-plugin-media-upload.ts
const VARIANT_CONFIG = {
  thumbnail: { width: 300, quality: 70 },
  medium:    { width: 800, quality: 80 },
  large:     { width: 1920, quality: 85 },
};

// Imagens a processar
const STATIC_IMAGES = [
  { file: 'hero-bg.webp', sourceType: 'page', sourceId: 'index',         alt: 'Loja Comercial JR - Máquinas, ferramentas e irrigação' },
  { file: 'logo.webp',    sourceType: 'page', sourceId: 'layout-header', alt: 'Comercial JR' },
  { file: 'favicon.webp', sourceType: 'page', sourceId: 'layout-footer', alt: 'Comercial JR' },
];

const DRY_RUN = process.argv.includes('--dry-run');

// --- Load sharp ---
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('ERRO: sharp não encontrado. Instale com: npm install --save-dev sharp');
  process.exit(1);
}

// --- Helpers ---
function readCatalog() {
  try {
    return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  } catch {
    return { version: 1, updatedAt: '', items: [] };
  }
}

function writeCatalog(catalog) {
  catalog.updatedAt = new Date().toISOString();
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');
}

function getMediaDir(id) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `media/${year}/${month}/${id}`;
}

async function generateBlurPlaceholder(buffer) {
  const tiny = await sharp(buffer)
    .resize(20, null, { withoutEnlargement: true })
    .webp({ quality: 20 })
    .toBuffer();
  return `data:image/webp;base64,${tiny.toString('base64')}`;
}

// --- Main ---
async function main() {
  console.log('=== Processador de Imagens Estáticas ===');
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN' : 'EXECUÇÃO'}\n`);

  const catalog = readCatalog();

  // Verificar quais já existem no catálogo
  const existingSourceIds = new Set(catalog.items.map(i => `${i.sourceType}:${i.sourceId}`));

  const results = [];

  for (const img of STATIC_IMAGES) {
    const srcPath = path.join(PUBLIC_DIR, img.file);

    if (!fs.existsSync(srcPath)) {
      console.warn(`[skip] Arquivo não encontrado: ${img.file}`);
      continue;
    }

    const key = `${img.sourceType}:${img.sourceId}`;
    if (existingSourceIds.has(key)) {
      console.log(`[skip] Já indexado: ${img.file} (${key})`);
      continue;
    }

    const id = crypto.randomUUID();
    const relDir = getMediaDir(id);
    const absDir = path.join(PUBLIC_DIR, relDir);

    console.log(`[process] ${img.file} → /${relDir}/`);

    if (DRY_RUN) {
      results.push({ file: img.file, id, relDir });
      continue;
    }

    fs.mkdirSync(absDir, { recursive: true });

    const buffer = fs.readFileSync(srcPath);
    const metadata = await sharp(buffer).metadata();
    const origWidth = metadata.width || 0;
    const origHeight = metadata.height || 0;
    const hasAlpha = metadata.hasAlpha || false;

    const paths = {};

    // Gerar variantes WebP (preservando alpha)
    for (const [variant, config] of Object.entries(VARIANT_CONFIG)) {
      const outPath = path.join(absDir, `${variant}.webp`);
      await sharp(buffer)
        .resize(config.width, null, { withoutEnlargement: true })
        .webp({ quality: config.quality, alphaQuality: hasAlpha ? 100 : undefined })
        .toFile(outPath);
      paths[variant] = `/${relDir}/${variant}.webp`;

      const stat = fs.statSync(outPath);
      console.log(`  ${variant}.webp: ${(stat.size / 1024).toFixed(1)} KB`);
    }

    // Copiar original
    const ext = path.extname(img.file).slice(1) || 'webp';
    const origDest = path.join(absDir, `original.${ext}`);
    fs.copyFileSync(srcPath, origDest);
    paths.original = `/${relDir}/original.${ext}`;

    // Gerar blur placeholder
    const blurDataUrl = await generateBlurPlaceholder(buffer);

    const stat = fs.statSync(srcPath);

    const mediaItem = {
      id,
      name: img.file,
      alt: img.alt,
      paths,
      width: origWidth,
      height: origHeight,
      size: stat.size,
      mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      uploadedAt: new Date().toISOString(),
      sourceType: img.sourceType,
      sourceId: img.sourceId,
      blurDataUrl,
    };

    catalog.items.push(mediaItem);
    results.push({ file: img.file, id, relDir, mediaItem });

    console.log(`  original: ${(stat.size / 1024).toFixed(1)} KB → blur placeholder gerado`);
    console.log(`  Dimensões: ${origWidth}x${origHeight}, alpha: ${hasAlpha}`);
  }

  if (!DRY_RUN && results.length > 0) {
    writeCatalog(catalog);
    console.log(`\nCatálogo atualizado com ${results.length} item(s).`);
  }

  // Resumo final com paths para uso nos componentes
  console.log('\n=== RESUMO ===');
  for (const r of results) {
    console.log(`${r.file}:`);
    console.log(`  ID: ${r.id}`);
    console.log(`  Path (large): /${r.relDir}/large.webp`);
    console.log(`  Path (thumb): /${r.relDir}/thumbnail.webp`);
  }
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
