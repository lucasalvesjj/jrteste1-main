#!/usr/bin/env node
// ──────────────────────────────────────────────
// scripts/index-existing-media.ts
// ──────────────────────────────────────────────
// Script isolado (Node.js) para indexar imagens legadas
// que existem em /public mas não estão no media-library.json.
//
// USO:
//   npx tsx scripts/index-existing-media.ts
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

// ── Configuração ──────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const CATALOG_PATH = path.join(PUBLIC_DIR, "data", "media-library.json");

/** Extensões aceitas (sem ponto, lowercase) */
const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

/**
 * Diretórios a escanear e suas regras.
 * shallow=true: apenas arquivos soltos (não recursivo em subpastas com UUID)
 */
const SCAN_TARGETS: { dir: string; shallow: boolean }[] = [
  { dir: path.join(PUBLIC_DIR, "blog"),   shallow: false },
  { dir: path.join(PUBLIC_DIR, "images"), shallow: false },
  { dir: path.join(PUBLIC_DIR, "media"),  shallow: true  },
];

// ── Tipos (inline para não depender do runtime da app) ──

interface MediaItemPaths {
  thumbnail: string;
  medium: string;
  large: string;
  original: string;
}

interface MediaItem {
  id: string;
  name: string;
  alt: string;
  paths: MediaItemPaths;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  uploadedAt: string;
  sourceType: string;
  sourceId: string;
}

interface MediaCatalog {
  version: number;
  updatedAt: string;
  items: MediaItem[];
}

// ── Helpers ───────────────────────────────────

/** Infere o mimeType pela extensão do arquivo */
function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    png:  "image/png",
    webp: "image/webp",
    gif:  "image/gif",
    avif: "image/avif",
  };
  return map[ext.toLowerCase()] ?? "image/jpeg";
}

/** Converte caminho absoluto em URL relativa à /public */
function toPublicUrl(absolutePath: string): string {
  const relative = path.relative(PUBLIC_DIR, absolutePath);
  // Normaliza separadores para forward slash
  return "/" + relative.split(path.sep).join("/");
}

/**
 * Coleta arquivos de imagem em um diretório.
 * @param dir        Diretório a escanear
 * @param shallow    Se true, ignora subdiretórios (apenas arquivos soltos)
 */
function collectImages(dir: string, shallow: boolean): string[] {
  if (!fs.existsSync(dir)) {
    console.warn(`[skip] Diretório não encontrado: ${dir}`);
    return [];
  }

  const results: string[] = [];

  function walk(current: string, depth: number) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        // shallow=true: só escaneia a raiz (depth=0)
        if (!shallow || depth === 0) {
          // Para /public/media com shallow=true, ignoramos subpastas
          // (que contêm estrutura UUID da Media Library)
          if (shallow) continue;
          walk(fullPath, depth + 1);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1).toLowerCase();
        if (ACCEPTED_EXTENSIONS.has(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(dir, 0);
  return results;
}

/** Gera um MediaItem legado para um arquivo de imagem */
function createLegacyItem(filePath: string): MediaItem {
  const stat = fs.statSync(filePath);
  const name = path.basename(filePath);
  const ext  = path.extname(name).slice(1).toLowerCase();
  const url  = toPublicUrl(filePath);

  return {
    id:         crypto.randomUUID(),
    name,
    alt:        "",
    paths: {
      thumbnail: url,
      medium:    url,
      large:     url,
      original:  url,
    },
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

  // Ler catálogo existente
  let catalog: MediaCatalog;
  try {
    const raw = fs.readFileSync(CATALOG_PATH, "utf-8");
    catalog = JSON.parse(raw) as MediaCatalog;
  } catch {
    console.error(`Erro ao ler o catálogo: ${CATALOG_PATH}`);
    process.exit(1);
  }

  // Construir set de paths.original já indexados (para deduplicação)
  const existingOriginals = new Set(
    catalog.items.map((item) => item.paths.original)
  );

  // Coletar todos os arquivos de imagem dos diretórios alvo
  const allFiles: string[] = [];
  for (const target of SCAN_TARGETS) {
    const files = collectImages(target.dir, target.shallow);
    const dirName = path.relative(PUBLIC_DIR, target.dir);
    console.log(`📁 /${dirName}: ${files.length} imagem(ns) encontrada(s)`);
    allFiles.push(...files);
  }

  // Filtrar apenas arquivos não indexados
  const newItems: MediaItem[] = [];
  for (const filePath of allFiles) {
    const url = toPublicUrl(filePath);
    if (existingOriginals.has(url)) {
      console.log(`  ✓ já indexado: ${url}`);
      continue;
    }
    const item = createLegacyItem(filePath);
    newItems.push(item);
    console.log(`  + novo: ${url}`);
  }

  if (newItems.length === 0) {
    console.log("\n✅ Nenhum arquivo novo encontrado. Catálogo já está atualizado.");
    return;
  }

  // Inserir novos itens no início do catálogo (mais recentes primeiro)
  catalog.items = [...newItems, ...catalog.items];
  catalog.updatedAt = new Date().toISOString();

  // Salvar catálogo atualizado
  const output = JSON.stringify(catalog, null, 2);
  fs.writeFileSync(CATALOG_PATH, output, "utf-8");

  console.log(`\n✅ ${newItems.length} mídia(s) legada(s) indexada(s) com sucesso!`);
  console.log(`📄 Catálogo atualizado: ${CATALOG_PATH}`);
}

main();
