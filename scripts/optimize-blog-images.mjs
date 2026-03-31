#!/usr/bin/env node
/**
 * Otimiza imagens do blog: gera variantes WebP (thumbnail, medium, large),
 * indexa no media-library.json, e atualiza referências nos posts.
 *
 * Uso:
 *   node scripts/optimize-blog-images.mjs                  # processa todas
 *   node scripts/optimize-blog-images.mjs --dry-run        # apenas mostra o que faria
 *   node scripts/optimize-blog-images.mjs --slug=inversor-para-solda  # apenas 1 post
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'public', 'blog');
const MEDIA_BASE = path.join(ROOT, 'public', 'media');
const CATALOG_PATH = path.join(ROOT, 'public', 'data', 'media-library.json');
const BLOG_JSON_PATH = path.join(ROOT, 'public', 'data', 'blog-posts.json');

// Variant config matching vite-plugin-media-upload.ts
const VARIANT_CONFIG = {
  thumbnail: { width: 300, quality: 70 },
  medium:    { width: 800, quality: 80 },
  large:     { width: 1920, quality: 85 },
};

// CLI args
const args = process.argv.slice(2);
const flags = {};
for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, val] = arg.slice(2).split('=');
    flags[key] = val ?? true;
  }
}
const DRY_RUN = flags['dry-run'] === true;
const ONLY_SLUG = flags['slug'] || null;

// --- Load sharp ---
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (err) {
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

// --- Main processing ---
async function processImage(filePath, sourceType, sourceId) {
  const id = crypto.randomUUID();
  const relDir = getMediaDir(id);
  const absDir = path.join(ROOT, 'public', relDir);

  if (DRY_RUN) {
    return { id, relDir, skipped: false };
  }

  fs.mkdirSync(absDir, { recursive: true });

  // Read original image
  const buffer = fs.readFileSync(filePath);
  const metadata = await sharp(buffer).metadata();
  const origWidth = metadata.width || 0;
  const origHeight = metadata.height || 0;

  const paths = {};

  // Generate WebP variants
  for (const [variant, config] of Object.entries(VARIANT_CONFIG)) {
    const outPath = path.join(absDir, `${variant}.webp`);
    // Only resize if original is larger than target
    const resizeWidth = origWidth > config.width ? config.width : origWidth;
    await sharp(buffer)
      .resize(resizeWidth, null, { withoutEnlargement: true })
      .webp({ quality: config.quality })
      .toFile(outPath);
    paths[variant] = `/${relDir}/${variant}.webp`;
  }

  // Copy original
  const ext = path.extname(filePath).slice(1) || 'jpg';
  const origDest = path.join(absDir, `original.${ext}`);
  fs.copyFileSync(filePath, origDest);
  paths.original = `/${relDir}/original.${ext}`;

  const stat = fs.statSync(filePath);

  return {
    id,
    relDir,
    skipped: false,
    mediaItem: {
      id,
      name: path.basename(filePath),
      alt: '',
      paths,
      width: origWidth,
      height: origHeight,
      size: stat.size,
      mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      uploadedAt: new Date().toISOString(),
      sourceType,
      sourceId,
    },
  };
}

async function main() {
  console.log('=== Otimizador de Imagens do Blog ===');
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN' : 'EXECUÇÃO'}`);
  if (ONLY_SLUG) console.log(`Slug: ${ONLY_SLUG}`);
  console.log('');

  // Load blog data
  const blogData = JSON.parse(fs.readFileSync(BLOG_JSON_PATH, 'utf-8'));
  const catalog = readCatalog();

  // Build a set of existing catalog paths to avoid duplicates
  const existingPaths = new Set();
  for (const item of catalog.items) {
    existingPaths.add(item.paths.original);
    existingPaths.add(item.paths.large);
  }

  // Collect all image files referenced by posts
  const imageJobs = []; // { filePath, sourceType, sourceId, refType, originalRef }

  const targetPosts = ONLY_SLUG
    ? blogData.posts.filter(p => p.slug === ONLY_SLUG)
    : blogData.posts;

  for (const post of targetPosts) {
    // Featured image
    if (post.image && post.image.startsWith('/blog/')) {
      const absPath = path.join(ROOT, 'public', post.image);
      if (fs.existsSync(absPath)) {
        imageJobs.push({
          filePath: absPath,
          sourceType: 'post',
          sourceId: post.slug,
          refType: 'featured',
          postSlug: post.slug,
          originalRef: post.image,
        });
      }
    }

    // Inline images in content
    const imgRegex = /src="(\/blog\/[^"]+)"/g;
    let match;
    while ((match = imgRegex.exec(post.content)) !== null) {
      const imgPath = match[1];
      const absPath = path.join(ROOT, 'public', imgPath);
      if (fs.existsSync(absPath)) {
        imageJobs.push({
          filePath: absPath,
          sourceType: 'post',
          sourceId: post.slug,
          refType: 'inline',
          postSlug: post.slug,
          originalRef: imgPath,
        });
      }
    }
  }

  // Deduplicate by filePath
  const uniqueJobs = [];
  const seenFiles = new Set();
  for (const job of imageJobs) {
    if (!seenFiles.has(job.filePath)) {
      seenFiles.add(job.filePath);
      uniqueJobs.push(job);
    }
  }

  console.log(`Posts a processar: ${targetPosts.length}`);
  console.log(`Imagens encontradas: ${imageJobs.length} (${uniqueJobs.length} únicas)`);
  console.log('');

  // Process each image
  const pathMap = {}; // oldPath -> newLargePath (for updating references)
  const newItems = [];
  const stats = { processed: 0, skipped: 0, errors: 0 };

  for (let i = 0; i < uniqueJobs.length; i++) {
    const job = uniqueJobs[i];
    const shortName = path.basename(job.filePath);

    try {
      console.log(`[${i + 1}/${uniqueJobs.length}] ${shortName} (${job.refType}, ${job.postSlug})`);

      const result = await processImage(job.filePath, job.sourceType, job.sourceId);

      if (DRY_RUN) {
        console.log(`  [dry-run] Geraria variantes em /${result.relDir}/`);
        pathMap[job.originalRef] = `/${result.relDir}/large.webp`;
      } else {
        newItems.push(result.mediaItem);
        pathMap[job.originalRef] = result.mediaItem.paths.large;
        console.log(`  -> ${result.mediaItem.paths.large}`);
      }

      stats.processed++;
    } catch (err) {
      console.error(`  [ERRO] ${shortName}: ${err.message}`);
      stats.errors++;
    }
  }

  // Update catalog
  if (!DRY_RUN && newItems.length > 0) {
    catalog.items = [...newItems, ...catalog.items];
    writeCatalog(catalog);
    console.log(`\n[salvo] media-library.json: +${newItems.length} itens (total: ${catalog.items.length})`);
  }

  // Update blog-posts.json references
  if (!DRY_RUN && Object.keys(pathMap).length > 0) {
    let updatedRefs = 0;
    for (const post of blogData.posts) {
      // Update featured image
      if (post.image && pathMap[post.image]) {
        post.image = pathMap[post.image];
        updatedRefs++;
      }

      // Update inline images in content
      for (const [oldPath, newPath] of Object.entries(pathMap)) {
        if (post.content.includes(oldPath)) {
          post.content = post.content.split(oldPath).join(newPath);
          updatedRefs++;
        }
      }

      // Update seo.ogImage if it was a blog path
      if (post.seo?.ogImage && pathMap[post.seo.ogImage]) {
        post.seo.ogImage = pathMap[post.seo.ogImage];
      }
    }

    blogData.exportedAt = new Date().toISOString();
    fs.writeFileSync(BLOG_JSON_PATH, JSON.stringify(blogData, null, 2), 'utf-8');
    console.log(`[salvo] blog-posts.json: ${updatedRefs} referências atualizadas`);
  }

  // Summary
  console.log('\n=== RESUMO ===');
  console.log(`Processadas: ${stats.processed}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Erros: ${stats.errors}`);
  if (!DRY_RUN) {
    console.log(`Novos itens no catálogo: ${newItems.length}`);
    console.log(`Variantes geradas: ${newItems.length * 3} WebP + ${newItems.length} originais`);
  }
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
