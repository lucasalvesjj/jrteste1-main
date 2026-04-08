#!/usr/bin/env node
/**
 * recompress-media.mjs
 * Recomprime TODAS as imagens existentes na Media Library
 * usando configurações otimizadas de compressão.
 *
 * Uso: node scripts/recompress-media.mjs [--dry-run]
 *
 * O script:
 *  1. Percorre todos os diretórios em public/media/
 *  2. Para cada pasta com original.*, regera thumbnail, medium e large
 *  3. SÓ SUBSTITUI se o novo arquivo for MENOR que o existente
 *  4. Não faz upscale (withoutEnlargement: true)
 *  5. Flatten apenas para imagens com alpha (PNGs com transparência)
 *  6. Exibe log com economia e resumo final
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MEDIA_DIR = path.join(ROOT, "public", "media");
const DRY_RUN = process.argv.includes("--dry-run");

// ── Sharp ──
const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error("❌ Sharp não encontrado. Execute: npm install sharp");
  process.exit(1);
}

// ── Configuração (mesma do plugin atualizado) ──
const VARIANT_CONFIG = {
  thumbnail: { width: 300,  quality: 65, effort: 6 },
  medium:    { width: 800,  quality: 72, effort: 6 },
  large:     { width: 1920, quality: 75, effort: 6 },
};

// ── Helpers ──
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function findMediaDirs(baseDir) {
  const dirs = [];
  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    const hasOriginal = entries.some((e) => e.isFile() && e.name.startsWith("original."));
    if (hasOriginal) { dirs.push(dir); return; }
    for (const entry of entries) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name));
    }
  }
  walk(baseDir);
  return dirs;
}

// ── Main ──
async function main() {
  if (DRY_RUN) console.log("🏃 Modo DRY RUN — nenhum arquivo será alterado\n");
  console.log("🔍 Buscando imagens em public/media/ ...\n");

  const mediaDirs = findMediaDirs(MEDIA_DIR);
  console.log(`📦 ${mediaDirs.length} imagens encontradas.\n`);
  if (mediaDirs.length === 0) return;

  let totalBefore = 0, totalAfter = 0;
  let improved = 0, skipped = 0, errors = 0;

  for (const dir of mediaDirs) {
    const relDir = path.relative(path.join(ROOT, "public"), dir);
    const files = fs.readdirSync(dir);
    const originalFile = files.find((f) => f.startsWith("original."));
    if (!originalFile) { console.log(`⚠️  ${relDir} — sem original, pulando`); continue; }

    try {
      const originalPath = path.join(dir, originalFile);
      const originalBuffer = fs.readFileSync(originalPath);
      const metadata = await sharp(originalBuffer).metadata();

      let dirBefore = 0, dirAfter = 0;
      let anyImproved = false;

      for (const [variant, cfg] of Object.entries(VARIANT_CONFIG)) {
        const outPath = path.join(dir, `${variant}.webp`);
        const tmpPath = outPath + ".tmp";
        const existingSize = fs.existsSync(outPath) ? fs.statSync(outPath).size : Infinity;

        // Pipeline: resize sem upscale
        const pipeline = sharp(originalBuffer)
          .resize(cfg.width, null, { withoutEnlargement: true });

        // Flatten apenas para imagens com alpha (PNG com transparência)
        if (metadata.hasAlpha) {
          pipeline.flatten({ background: "#ffffff" });
        }

        await pipeline
          .webp({ quality: cfg.quality, effort: cfg.effort })
          .toFile(tmpPath);

        const newSize = fs.statSync(tmpPath).size;

        if (newSize < existingSize) {
          // Novo é menor → substituir
          if (!DRY_RUN) {
            fs.renameSync(tmpPath, outPath);
          } else {
            fs.unlinkSync(tmpPath);
          }
          dirBefore += existingSize === Infinity ? newSize : existingSize;
          dirAfter += newSize;
          anyImproved = true;
        } else {
          // Novo é maior ou igual → descartar, manter original
          fs.unlinkSync(tmpPath);
          dirBefore += existingSize === Infinity ? 0 : existingSize;
          dirAfter += existingSize === Infinity ? 0 : existingSize;
        }
      }

      totalBefore += dirBefore;
      totalAfter += dirAfter;

      if (anyImproved) {
        improved++;
        const saved = dirBefore - dirAfter;
        const pct = dirBefore > 0 ? ((saved / dirBefore) * 100).toFixed(1) : "0.0";
        console.log(`✅ ${relDir} — ${formatBytes(dirBefore)} → ${formatBytes(dirAfter)} (-${formatBytes(saved)}, ${pct}%)`);
      } else {
        skipped++;
      }
    } catch (err) {
      errors++;
      console.log(`❌ ${relDir} — erro: ${err.message}`);
    }
  }

  console.log(`\n   (${skipped} imagens já estavam otimizadas — sem alteração)`);
  console.log("\n" + "═".repeat(60));
  console.log("📊 RESUMO DA RECOMPRESSÃO");
  console.log("═".repeat(60));
  console.log(`   Imagens melhoradas: ${improved}`);
  console.log(`   Já otimizadas (sem alteração): ${skipped}`);
  console.log(`   Erros: ${errors}`);
  console.log(`   Tamanho antes (melhoradas): ${formatBytes(totalBefore)}`);
  console.log(`   Tamanho depois (melhoradas): ${formatBytes(totalAfter)}`);
  const totalSaved = totalBefore - totalAfter;
  const totalPct = totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : "0.0";
  console.log(`   Economia total: ${formatBytes(totalSaved)} (${totalPct}%)`);
  console.log("═".repeat(60));
}

main().catch((err) => { console.error("❌ Erro fatal:", err); process.exit(1); });
