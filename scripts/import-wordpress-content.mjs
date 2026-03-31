#!/usr/bin/env node
/**
 * Script de importação de conteúdo do blog WordPress (comercialjrltda.com.br)
 *
 * Uso:
 *   node scripts/import-wordpress-content.mjs                    # processa todos os 72 posts
 *   node scripts/import-wordpress-content.mjs --slug=inversor-para-solda  # processa 1 post
 *   node scripts/import-wordpress-content.mjs --dry-run          # apenas mostra o que faria
 *   node scripts/import-wordpress-content.mjs --skip-images      # não baixa imagens
 *   node scripts/import-wordpress-content.mjs --delay=2000       # delay customizado (ms)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

// --- Config ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BLOG_JSON_PATH = path.join(ROOT, 'public', 'data', 'blog-posts.json');
const CACHE_DIR = path.join(__dirname, '.cache');
const IMAGES_DIR = path.join(ROOT, 'public', 'blog');
const BASE_URL = 'https://comercialjrltda.com.br';

// --- Parse CLI args ---
const args = process.argv.slice(2);
const flags = {};
for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, val] = arg.slice(2).split('=');
    flags[key] = val ?? true;
  }
}

const DRY_RUN = flags['dry-run'] === true;
const SKIP_IMAGES = flags['skip-images'] === true;
const ONLY_SLUG = flags['slug'] || null;
const DELAY_MS = parseInt(flags['delay'] || '1500', 10);
const MAX_RETRIES = 3;

// --- Helpers ---

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BlogImporter/1.0)',
          'Accept': 'text/html,application/xhtml+xml,*/*',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (err) {
      console.warn(`  [tentativa ${attempt}/${retries}] Erro ao buscar ${url}: ${err.message}`);
      if (attempt === retries) throw err;
      await sleep(1000 * attempt); // backoff
    }
  }
}

async function fetchHtmlCached(slug) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${slug}.html`);

  if (fs.existsSync(cachePath)) {
    console.log(`  [cache] Usando cache para: ${slug}`);
    return fs.readFileSync(cachePath, 'utf-8');
  }

  const url = `${BASE_URL}/${slug}/`;
  console.log(`  [fetch] Baixando: ${url}`);
  const res = await fetchWithRetry(url);
  const html = await res.text();
  fs.writeFileSync(cachePath, html, 'utf-8');
  return html;
}

async function downloadImage(url, destPath) {
  if (DRY_RUN || SKIP_IMAGES) return false;
  try {
    const res = await fetchWithRetry(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    console.warn(`  [img-erro] Falha ao baixar imagem ${url}: ${err.message}`);
    return false;
  }
}

// --- Extraction ---

function extractPostData(html, slug) {
  const $ = cheerio.load(html);

  // Title
  const title = $('meta[property="og:title"]').attr('content')
    || $('h1.entry-title').text().trim()
    || '';

  // Dates
  const publishDate = $('meta[property="article:published_time"]').attr('content') || '';
  const modifiedDate = $('meta[property="article:modified_time"]').attr('content') || '';

  // Categories from WordPress
  const wpCategories = [];
  $('a[rel="category tag"], .cat-links a, .post-categories a').each((_, el) => {
    const cat = $(el).text().trim();
    if (cat && cat.toLowerCase() !== 'todos') {
      wpCategories.push(cat);
    }
  });

  // Featured image
  const featuredImage = $('meta[property="og:image"]').attr('content') || '';

  // SEO
  const metaTitle = $('meta[property="og:title"]').attr('content')
    || $('title').text().trim()
    || title;
  const metaDescription = $('meta[name="description"]').attr('content')
    || $('meta[property="og:description"]').attr('content')
    || '';

  // Content extraction from .entry-content (WordPress standard)
  const contentParts = [];
  const inlineImages = [];

  const entryContent = $('.entry-content').first();

  // Detect if entry-content is Elementor-based (single .elementor child)
  const isElementorContent = entryContent.length
    && entryContent.children().length === 1
    && entryContent.children().first().hasClass('elementor');

  if (isElementorContent) {
    // Elementor-based posts: extract from widgets inside entry-content
    entryContent.find('.elementor-widget-heading, .elementor-widget-text-editor, .elementor-widget-image').each((_, widget) => {
      const $widget = $(widget);

      // Skip header/footer/nav
      if ($widget.closest('header, footer, nav, .sidebar').length) return;

      if ($widget.hasClass('elementor-widget-heading')) {
        const heading = $widget.find('h1, h2, h3, h4, h5, h6').first();
        if (heading.length) {
          const tag = heading.prop('tagName').toLowerCase();
          const text = heading.text().trim();
          if (text && text !== title) {
            contentParts.push(`<${tag}>${text}</${tag}>`);
          }
        }
      } else if ($widget.hasClass('elementor-widget-text-editor')) {
        const editor = $widget.find('.elementor-text-editor, .elementor-widget-container').first();
        if (editor.length) {
          const html = cleanInlineHtml(editor.html(), $);
          if (html.trim()) {
            // Wrap in <p> if not already wrapped in block tags
            if (html.trim().startsWith('<p') || html.trim().startsWith('<ul') || html.trim().startsWith('<ol') || html.trim().startsWith('<h')) {
              contentParts.push(html);
            } else {
              contentParts.push(`<p>${html}</p>`);
            }
          }
        }
      } else if ($widget.hasClass('elementor-widget-image')) {
        const img = $widget.find('img').first();
        if (img.length) {
          const src = img.attr('data-src') || img.attr('data-lazy-src') || img.attr('src') || '';
          const alt = img.attr('alt') || '';
          if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
            inlineImages.push(src);
            const imgIndex = inlineImages.length;
            contentParts.push(`<figure><img src="/blog/${slug}-${imgIndex}.jpg" alt="${escapeHtml(alt)}" loading="lazy" /></figure>`);
          }
        }
      }
    });
  } else if (!entryContent.length || entryContent.text().trim().length === 0) {
    // No entry-content or it's empty — Elementor full-page template
    // Search entire page for content widgets
    const body = $('body');
    body.find('.elementor-widget-container').each((_, el) => {
      const $el = $(el);
      // Skip header, footer, nav, sidebar, product cards
      if ($el.closest('header, footer, nav, .sidebar, .related-posts, .comments-area, #comments').length) return;

      // Process paragraphs inside widget containers
      $el.children('p, h2, h3, h4, h5, h6, ul, ol').each((_, child) => {
        const $child = $(child);
        const tag = $child.prop('tagName').toLowerCase();
        const text = $child.text().trim();
        if (!text || text.length < 20) return; // skip very short fragments
        if (text === title) return;
        // Skip product-like content (prices, "List Item")
        if (text.includes('List Item') || /^R\$/.test(text)) return;

        if (['h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
          contentParts.push(`<${tag}>${text}</${tag}>`);
        } else {
          const html = cleanInlineHtml($child.html(), $);
          if (html.trim()) {
            contentParts.push(`<${tag}>${html}</${tag}>`);
          }
        }
      });

      // Handle images
      $el.find('img').each((_, img) => {
        const $img = $(img);
        const src = $img.attr('data-src') || $img.attr('data-lazy-src') || $img.attr('src') || '';
        const alt = $img.attr('alt') || '';
        if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon') && !src.includes('placeholder')) {
          inlineImages.push(src);
          const imgIndex = inlineImages.length;
          contentParts.push(`<figure><img src="/blog/${slug}-${imgIndex}.jpg" alt="${escapeHtml(alt)}" loading="lazy" /></figure>`);
        }
      });
    });
  } else if (entryContent.length) {
    // Standard WordPress posts: process direct children of .entry-content
    entryContent.children().each((_, el) => {
      const $el = $(el);
      const tag = ($el.prop('tagName') || '').toLowerCase();

      // Skip style, script, elementor divs, and empty elements
      if (['style', 'script', 'noscript'].includes(tag)) return;
      if ($el.hasClass('elementor') || $el.hasClass('sharedaddy') || $el.hasClass('jp-relatedposts')) return;

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const text = $el.text().trim();
        if (text && text !== title) {
          contentParts.push(`<${tag}>${text}</${tag}>`);
        }
      } else if (tag === 'p') {
        // Handle paragraphs - may contain inline images
        const imgs = $el.find('img');
        if (imgs.length) {
          imgs.each((_, img) => {
            const $img = $(img);
            const src = $img.attr('data-src') || $img.attr('data-lazy-src') || $img.attr('src') || '';
            const alt = $img.attr('alt') || '';
            if (src && src.startsWith('http')) {
              inlineImages.push(src);
              const imgIndex = inlineImages.length;
              contentParts.push(`<figure><img src="/blog/${slug}-${imgIndex}.jpg" alt="${escapeHtml(alt)}" loading="lazy" /></figure>`);
            }
          });
          // Also keep any text in the paragraph
          const text = $el.text().trim();
          if (text) {
            contentParts.push(`<p>${cleanInlineHtml($el.html(), $)}</p>`);
          }
        } else {
          const html = cleanInlineHtml($el.html(), $);
          if (html.trim()) {
            contentParts.push(`<p>${html}</p>`);
          }
        }
      } else if (['ul', 'ol'].includes(tag)) {
        const html = cleanInlineHtml($el.html(), $);
        if (html.trim()) {
          contentParts.push(`<${tag}>${html}</${tag}>`);
        }
      } else if (tag === 'figure' || tag === 'div') {
        // Check for images inside divs/figures
        const imgs = $el.find('img');
        imgs.each((_, img) => {
          const $img = $(img);
          const src = $img.attr('data-src') || $img.attr('data-lazy-src') || $img.attr('src') || '';
          const alt = $img.attr('alt') || '';
          if (src && src.startsWith('http')) {
            inlineImages.push(src);
            const imgIndex = inlineImages.length;
            contentParts.push(`<figure><img src="/blog/${slug}-${imgIndex}.jpg" alt="${escapeHtml(alt)}" loading="lazy" /></figure>`);
          }
        });
        // If div has text content (not just images), include it
        if (tag === 'div' && !$el.hasClass('elementor')) {
          const text = $el.text().trim();
          if (text && !imgs.length) {
            contentParts.push(`<p>${cleanInlineHtml($el.html(), $)}</p>`);
          }
        }
      } else if (tag === 'blockquote' || tag === 'table') {
        const html = cleanInlineHtml($el.html(), $);
        if (html.trim()) {
          contentParts.push(`<${tag}>${html}</${tag}>`);
        }
      }
    });
  }

  return {
    title,
    publishDate,
    modifiedDate,
    wpCategories,
    featuredImage,
    metaTitle,
    metaDescription,
    contentHtml: contentParts.join('\n'),
    inlineImages,
  };
}

/**
 * Clean inline HTML content (inside p, li, etc.)
 * Keeps: a, strong, b, em, i, br, li tags
 * Removes: styles, classes, data attrs, span/div wrappers
 */
function cleanInlineHtml(html, $) {
  if (!html) return '';

  const $frag = cheerio.load(`<div id="__clean">${html}</div>`, { xmlMode: false });
  const container = $frag('#__clean');

  // Remove all style, class, id, data attributes
  container.find('*').each((_, el) => {
    const $el = $frag(el);
    const attrs = Object.keys(el.attribs || {});
    for (const attr of attrs) {
      if (attr !== 'href' && attr !== 'src' && attr !== 'alt') {
        $el.removeAttr(attr);
      }
    }
  });

  // Unwrap span/div wrappers
  container.find('div, span').each((_, el) => {
    const $el = $frag(el);
    $el.replaceWith($el.html() || '');
  });

  // Clean a tags - convert internal links
  container.find('a').each((_, el) => {
    const $el = $frag(el);
    const href = $el.attr('href') || '';
    if (href.startsWith(BASE_URL)) {
      $el.attr('href', href.replace(BASE_URL, ''));
    }
  });

  // Remove img tags from inline content (handled separately)
  container.find('img').remove();

  let result = container.html() || '';
  result = result.replace(/\n{3,}/g, '\n\n').trim();
  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Category mapping ---

function mapCategories(wpCategories, currentCategories) {
  if (!wpCategories.length) return currentCategories;

  const mapped = new Set();
  for (const cat of wpCategories) {
    const lower = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower.includes('agricultura') || lower.includes('irrigac') || lower.includes('cafe') || lower.includes('lavoura')) {
      mapped.add('irrigacao');
    } else if (lower.includes('ferramenta')) {
      mapped.add('ferramentas');
    } else if (lower.includes('maquina') || lower.includes('eletrica')) {
      mapped.add('maquinas');
    }
  }

  return mapped.size > 0 ? [...mapped] : currentCategories;
}

// --- Main ---

async function main() {
  console.log('=== Importador de Conteúdo WordPress ===');
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN' : 'EXECUÇÃO'}`);
  console.log(`Imagens: ${SKIP_IMAGES ? 'PULAR' : 'BAIXAR'}`);
  console.log(`Delay: ${DELAY_MS}ms`);
  if (ONLY_SLUG) console.log(`Slug: ${ONLY_SLUG}`);
  console.log('');

  // Load current blog data
  const blogData = JSON.parse(fs.readFileSync(BLOG_JSON_PATH, 'utf-8'));
  const posts = blogData.posts;

  // Filter if single slug
  const targetPosts = ONLY_SLUG
    ? posts.filter(p => p.slug === ONLY_SLUG)
    : posts;

  if (ONLY_SLUG && targetPosts.length === 0) {
    console.error(`Slug "${ONLY_SLUG}" não encontrado em blog-posts.json`);
    process.exit(1);
  }

  console.log(`Posts a processar: ${targetPosts.length}`);
  console.log('');

  // Ensure images dir
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // Stats
  const stats = { processed: 0, updated: 0, imageDownloads: 0, errors: [] };

  for (const post of targetPosts) {
    console.log(`\n[${stats.processed + 1}/${targetPosts.length}] ${post.slug}`);

    try {
      // Fetch HTML (cached)
      const html = await fetchHtmlCached(post.slug);

      // Extract data
      const extracted = extractPostData(html, post.slug);

      if (!extracted.contentHtml.trim()) {
        console.warn(`  [aviso] Conteúdo vazio para ${post.slug}`);
        stats.errors.push({ slug: post.slug, error: 'Conteúdo vazio' });
      }

      // Download featured image
      let featuredImagePath = post.image; // keep current if download fails
      if (extracted.featuredImage && !SKIP_IMAGES && !DRY_RUN) {
        const ext = 'jpg'; // save original format, can convert later
        const destFilename = `${post.slug}-featured.${ext}`;
        const destPath = path.join(IMAGES_DIR, destFilename);
        const ok = await downloadImage(extracted.featuredImage, destPath);
        if (ok) {
          featuredImagePath = `/blog/${destFilename}`;
          stats.imageDownloads++;
          console.log(`  [img] Imagem destacada salva: ${destFilename}`);
        }
      }

      // Download inline images
      if (!SKIP_IMAGES && !DRY_RUN) {
        for (let i = 0; i < extracted.inlineImages.length; i++) {
          const imgUrl = extracted.inlineImages[i];
          const destFilename = `${post.slug}-${i + 1}.jpg`;
          const destPath = path.join(IMAGES_DIR, destFilename);
          const ok = await downloadImage(imgUrl, destPath);
          if (ok) {
            stats.imageDownloads++;
            console.log(`  [img] Inline ${i + 1} salva: ${destFilename}`);
          }
        }
      }

      // Map categories
      const newCategories = mapCategories(extracted.wpCategories, post.categories);

      // Format date
      const pubDate = extracted.publishDate
        ? extracted.publishDate.split('T')[0]
        : post.date;
      const modDate = extracted.modifiedDate
        ? extracted.modifiedDate.split('T')[0]
        : post.updatedAt;

      if (DRY_RUN) {
        console.log(`  [dry-run] Título: ${extracted.title}`);
        console.log(`  [dry-run] Data: ${pubDate}`);
        console.log(`  [dry-run] Categorias WP: ${extracted.wpCategories.join(', ') || '(nenhuma)'}`);
        console.log(`  [dry-run] Categorias mapeadas: ${newCategories.join(', ')}`);
        console.log(`  [dry-run] Imagem destacada: ${extracted.featuredImage || '(nenhuma)'}`);
        console.log(`  [dry-run] Imagens inline: ${extracted.inlineImages.length}`);
        console.log(`  [dry-run] Conteúdo: ${extracted.contentHtml.length} chars`);
      } else {
        // Update post in-place
        post.title = extracted.title || post.title;
        post.content = extracted.contentHtml || post.content;
        post.image = featuredImagePath;
        post.date = pubDate;
        post.updatedAt = modDate;
        post.categories = newCategories;
        post.category = newCategories[0] || post.category;
        post.seo.metaTitle = extracted.metaTitle || post.seo.metaTitle;
        post.seo.metaDescription = extracted.metaDescription || post.seo.metaDescription;
        stats.updated++;
      }

      stats.processed++;
    } catch (err) {
      console.error(`  [ERRO] ${post.slug}: ${err.message}`);
      stats.errors.push({ slug: post.slug, error: err.message });
      stats.processed++;
    }

    // Rate limiting
    if (stats.processed < targetPosts.length) {
      await sleep(DELAY_MS);
    }
  }

  // Save updated JSON
  if (!DRY_RUN && stats.updated > 0) {
    blogData.exportedAt = new Date().toISOString();
    fs.writeFileSync(BLOG_JSON_PATH, JSON.stringify(blogData, null, 2), 'utf-8');
    console.log(`\n[salvo] blog-posts.json atualizado`);
  }

  // Summary
  console.log('\n=== RESUMO ===');
  console.log(`Processados: ${stats.processed}`);
  console.log(`Atualizados: ${stats.updated}`);
  console.log(`Imagens baixadas: ${stats.imageDownloads}`);
  console.log(`Erros: ${stats.errors.length}`);
  if (stats.errors.length) {
    console.log('Detalhes dos erros:');
    for (const e of stats.errors) {
      console.log(`  - ${e.slug}: ${e.error}`);
    }
  }
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
