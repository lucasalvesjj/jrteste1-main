#!/usr/bin/env node
/**
 * Importa ALT texts do site antigo para:
 * 1. media-library.json (campo alt de cada MediaItem)
 * 2. blog-posts.json (campo imageAlt + alt nas <img> do content)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(__dirname, '.cache');
const CATALOG_PATH = path.join(ROOT, 'public', 'data', 'media-library.json');
const BLOG_JSON_PATH = path.join(ROOT, 'public', 'data', 'blog-posts.json');

const BASE_URL = 'https://comercialjrltda.com.br';

// CLI
const DRY_RUN = process.argv.includes('--dry-run');

function extractImageAlts(html) {
  const $ = cheerio.load(html);
  const alts = {}; // wpUrl -> alt text

  $('img').each((_, el) => {
    const src = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('src') || '';
    const alt = ($(el).attr('alt') || '').trim();

    // Only care about wp-content images with actual alt text
    if (src.includes('wp-content/uploads') && alt) {
      // Normalize: strip query params, get filename
      const cleanUrl = src.split('?')[0];
      alts[cleanUrl] = alt;

      // Also store by filename for fuzzy matching
      const filename = path.basename(cleanUrl).toLowerCase();
      alts[`__file__${filename}`] = alt;

      // Store without size suffix (e.g., image-300x300.jpg -> image.jpg)
      const noSize = filename.replace(/-\d+x\d+(\.\w+)$/, '$1');
      if (noSize !== filename) {
        alts[`__file__${noSize}`] = alt;
      }
    }
  });

  // Featured image alt = og:title (most descriptive)
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogImage = ($('meta[property="og:image"]').attr('content') || '').split('?')[0];
  if (ogImage && ogTitle) {
    // Clean title suffix for alt
    const cleanTitle = ogTitle.replace(/\s*[-–]\s*Comercial JR\s*$/i, '').trim();
    alts[`__featured__`] = cleanTitle;

    // Also map the og:image URL
    alts[ogImage] = cleanTitle;
    const ogFilename = path.basename(ogImage).toLowerCase();
    alts[`__file__${ogFilename}`] = cleanTitle;
  }

  return alts;
}

function findAltForImage(mediaItem, altMap) {
  // Try by original filename
  const origFilename = mediaItem.name.toLowerCase();

  // The media item name is like "slug-featured.jpg" or "slug-1.jpg"
  // We need to match this back to the WordPress image

  // Try direct filename match
  const byFile = altMap[`__file__${origFilename}`];
  if (byFile) return byFile;

  // For featured images, use the featured alt
  if (origFilename.includes('-featured.')) {
    return altMap['__featured__'] || '';
  }

  // Try all file entries for partial matches
  for (const [key, alt] of Object.entries(altMap)) {
    if (!key.startsWith('__file__')) continue;
    // Check if either name contains the other
    const mapFile = key.replace('__file__', '');
    if (origFilename.includes(mapFile) || mapFile.includes(origFilename)) {
      return alt;
    }
  }

  return '';
}

async function main() {
  console.log('=== Importador de ALT Texts ===');
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN' : 'EXECUÇÃO'}`);
  console.log('');

  const blogData = JSON.parse(fs.readFileSync(BLOG_JSON_PATH, 'utf-8'));
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));

  // Build a map: sourceId (slug) -> altMap from WordPress
  const slugAltMaps = {};
  let cacheFiles = 0;

  for (const post of blogData.posts) {
    const cachePath = path.join(CACHE_DIR, `${post.slug}.html`);
    if (!fs.existsSync(cachePath)) {
      console.warn(`  [aviso] Cache não encontrado: ${post.slug}`);
      continue;
    }
    const html = fs.readFileSync(cachePath, 'utf-8');
    slugAltMaps[post.slug] = extractImageAlts(html);
    cacheFiles++;
  }

  console.log(`Cache HTML carregado: ${cacheFiles} arquivos`);

  // --- Update media-library.json ---
  let catalogUpdated = 0;

  for (const item of catalog.items) {
    if (item.sourceType !== 'post' || !item.sourceId) continue;
    if (item.alt && item.alt.length > 3) continue; // Already has alt

    const altMap = slugAltMaps[item.sourceId];
    if (!altMap) continue;

    const alt = findAltForImage(item, altMap);
    if (alt) {
      if (DRY_RUN) {
        console.log(`  [dry-run] ${item.name} -> alt: "${alt.slice(0, 60)}"`);
      } else {
        item.alt = alt;
      }
      catalogUpdated++;
    }
  }

  // --- Update blog-posts.json ---
  let postsUpdated = 0;
  let contentImgsUpdated = 0;

  for (const post of blogData.posts) {
    const altMap = slugAltMaps[post.slug];
    if (!altMap) continue;

    // Update imageAlt for featured image
    const featuredAlt = altMap['__featured__'] || '';
    if (featuredAlt && (!post.imageAlt || post.imageAlt.length < 3)) {
      if (DRY_RUN) {
        console.log(`  [dry-run] ${post.slug} imageAlt -> "${featuredAlt.slice(0, 60)}"`);
      } else {
        post.imageAlt = featuredAlt;
      }
      postsUpdated++;
    }

    // Update alt="" in content <img> tags
    // Match img tags and update their alt attributes
    if (post.content) {
      let newContent = post.content;

      // Find all img tags in content
      const imgRegex = /<img\s+([^>]*)>/g;
      let match;
      const replacements = [];

      while ((match = imgRegex.exec(post.content)) !== null) {
        const fullTag = match[0];
        const attrs = match[1];

        // Extract current src and alt
        const srcMatch = attrs.match(/src="([^"]+)"/);
        const altMatch = attrs.match(/alt="([^"]*)"/);

        if (!srcMatch) continue;
        const currentAlt = altMatch ? altMatch[1] : '';

        // Skip if already has a meaningful alt
        if (currentAlt && currentAlt.length > 3 && !currentAlt.includes('logo')) continue;

        // Try to find alt from the WordPress data
        // The src is now a /media/... path, match via catalog
        const src = srcMatch[1];
        const catalogItem = catalog.items.find(i =>
          i.paths && (i.paths.large === src || i.paths.medium === src || i.paths.original === src)
        );

        let bestAlt = '';
        if (catalogItem && catalogItem.alt) {
          bestAlt = catalogItem.alt;
        } else {
          // Fallback: use position-based matching from altMap
          // Content images are numbered slug-1, slug-2, etc.
          const allContentAlts = Object.entries(altMap)
            .filter(([k]) => k.startsWith('__file__') && !k.includes('featured') && !k.includes('logo') && !k.includes('capa'))
            .map(([, v]) => v);

          // Try to match by order in content
          const imgIndex = replacements.length;
          if (imgIndex < allContentAlts.length) {
            bestAlt = allContentAlts[imgIndex];
          }
        }

        if (bestAlt) {
          const escapedAlt = bestAlt.replace(/"/g, '&quot;');
          let newTag;
          if (altMatch) {
            newTag = fullTag.replace(/alt="[^"]*"/, `alt="${escapedAlt}"`);
          } else {
            newTag = fullTag.replace(/<img\s/, `<img alt="${escapedAlt}" `);
          }
          replacements.push({ old: fullTag, new: newTag });
          contentImgsUpdated++;
        }
      }

      // Apply replacements
      if (!DRY_RUN) {
        for (const r of replacements) {
          newContent = newContent.replace(r.old, r.new);
        }
        post.content = newContent;
      }
    }
  }

  // Save
  if (!DRY_RUN) {
    if (catalogUpdated > 0) {
      catalog.updatedAt = new Date().toISOString();
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');
      console.log(`[salvo] media-library.json: ${catalogUpdated} ALTs atualizados`);
    }

    if (postsUpdated > 0 || contentImgsUpdated > 0) {
      blogData.exportedAt = new Date().toISOString();
      fs.writeFileSync(BLOG_JSON_PATH, JSON.stringify(blogData, null, 2), 'utf-8');
      console.log(`[salvo] blog-posts.json: ${postsUpdated} imageAlt + ${contentImgsUpdated} content img ALTs`);
    }
  }

  console.log('\n=== RESUMO ===');
  console.log(`Catálogo ALTs atualizados: ${catalogUpdated}`);
  console.log(`Posts imageAlt atualizados: ${postsUpdated}`);
  console.log(`Content <img> ALTs atualizados: ${contentImgsUpdated}`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
