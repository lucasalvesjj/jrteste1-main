#!/usr/bin/env node
// ──────────────────────────────────────────────
// scripts/index-existing-media.mjs
// ──────────────────────────────────────────────
// Script isolado (Node.js ESM) para indexar imagens legadas
// que existem em /public mas não estão no media-library.json.
//
// USO:
//   node scripts/index-existing-media.mjs
//
// O QUE FAZ:
//   - Escaneia /public/blog, /public/images e /public/media (só arquivos soltos)
//   - Filtra extensões: .jpg .jpeg .png .webp .gif .avif
//   - Gera MediaItem com sourceType: "legacy" para cada arquivo novo
//   - Insere no media-library.json sem duplicar (checa paths.original)
//   - NÃO move, NÃO modifica e NÃO usa sharp
// ──────────────────────────────────────────────

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Configuração ──────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR   = path.join(PROJECT_ROOT, "public");
const CATALOG_PATH = path.join(PUBLIC_DIR, "data", "media-library.json");

const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

const SCAN_TARGETS = [
  { dir: path.join(PUBLIC_DIR, "blog"),   shallow: false },
  { dir: path.join(PUBLIC_DIR, "images"), shallow: false },
  { dir: path.join(PUBLIC_DIR, "media"),  shallow: true  },
];

// ── Helpers ───────────────────────────────────

function getMimeType(ext) {
  const map = {
    jpg: "image/jpeg", jpeg: "image/jpeg",
    png: "image/png",  webp: "image/webp",
    gif: "image/gif",  avif: "image/avif",
  };
  return map[ext.toLowerCase()] ?? "image/jpeg";
}

function toPublicUrl(absolutePath) {
  const relative = path.relative(PUBLIC_DIR, absolutePath);
  return "/" + relative.split(path.sep).join("/");
}

function collectImages(dir, shallow) {
  if (!fs.existsSync(dir)) {
    console.warn(`[skip] Diretório não encontrado: ${dir}`);
    return [];
  }
  const results = [];
  function walk(current, depth) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!shallow) walk(fullPath, depth + 1);
        // shallow=true: ignora subdiretórios (estrutura UUID da Media Library)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1).toLowerCase();
        if (ACCEPTED_EXTENSIONS.has(ext)) results.push(fullPath);
      }
    }
  }
  walk(dir, 0);
  return results;
}

function createLegacyItem(filePath) {
  const stat = fs.statSync(filePath);
  const name = path.basename(filePath);
  const ext  = path.extname(name).slice(1).toLowerCase();
  const url  = toPublicUrl(filePath);
  return {
    id:         crypto.randomUUID(),
    name,
    alt:        "",
    paths:      { thumbnail: url, medium: url, large: url, original: url },
    width:      0,
    height:     0,
    size:       stat.size,
    mimeType:   getMimeType(ext),
    uploadedAt: stat.mtime.toISOString(),
    sourceType: "legacy",
    sourceId:   "",
  };
}

// ── Main ──────────────────────────────────────

function main() {
  console.log("🔍 Indexando mídias legadas...\n");

  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));
  } catch {
    console.error(`Erro ao ler o catálogo: ${CATALOG_PATH}`);
    process.exit(1);
  }

  const existingOriginals = new Set(catalog.items.map((i) => i.paths.original));

  const allFiles = [];
  for (const target of SCAN_TARGETS) {
    const files = collectImages(target.dir, target.shallow);
    const dirName = path.relative(PUBLIC_DIR, target.dir);
    console.log(`📁 /${dirName}: ${files.length} imagem(ns) encontrada(s)`);
    allFiles.push(...files);
  }

  const newItems = [];
  for (const filePath of allFiles) {
    const url = toPublicUrl(filePath);
    if (existingOriginals.has(url)) {
      console.log(`  ✓ já indexado: ${url}`);
    } else {
      newItems.push(createLegacyItem(filePath));
      console.log(`  + novo: ${url}`);
    }
  }

  if (newItems.length === 0) {
    console.log("\n✅ Nenhum arquivo novo encontrado. Catálogo já está atualizado.");
    return;
  }

  catalog.items    = [...newItems, ...catalog.items];
  catalog.updatedAt = new Date().toISOString();
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), "utf-8");

  console.log(`\n✅ ${newItems.length} mídia(s) legada(s) indexada(s) com sucesso!`);
  console.log(`📄 Catálogo atualizado: ${CATALOG_PATH}`);
}

main();
