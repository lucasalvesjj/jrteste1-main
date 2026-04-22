#!/usr/bin/env node
/**
 * Migração one-shot: injeta id="slug" nos <h2> e <h3> de todos os posts existentes.
 *
 * Uso: node scripts/add-heading-ids.mjs
 *
 * - Cria backup automático antes de sobrescrever (blog-posts.backup-{timestamp}.json).
 * - Idempotente: posts que já têm ids não são modificados.
 * - Exibe contagem de posts alterados ao final.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { injectHeadingIds } from "./_lib/heading-ids.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.resolve(__dirname, "../public/data/blog-posts.json");

// Lê o arquivo original
if (!fs.existsSync(JSON_PATH)) {
  console.error(`✖ Arquivo não encontrado: ${JSON_PATH}`);
  process.exit(1);
}

const raw = fs.readFileSync(JSON_PATH, "utf8");
const data = JSON.parse(raw);

if (!Array.isArray(data.posts)) {
  console.error("✖ Estrutura inesperada: data.posts não é um array.");
  process.exit(1);
}

// Backup com timestamp antes de qualquer alteração
const backupPath = JSON_PATH.replace(/\.json$/, `.backup-${Date.now()}.json`);
fs.writeFileSync(backupPath, raw, "utf8");
console.log(`📦 Backup criado: ${path.basename(backupPath)}`);

// Processa cada post
let touched = 0;
let skipped = 0;

data.posts = data.posts.map((post) => {
  if (!post.content || typeof post.content !== "string") {
    skipped++;
    return post;
  }

  const next = injectHeadingIds(post.content);

  if (next === post.content) {
    skipped++;
    return post;
  }

  touched++;
  return { ...post, content: next };
});

// Salva com formatação preservada (2 espaços, igual ao original)
fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), "utf8");

console.log(`\n✔ Migração concluída:`);
console.log(`   Posts modificados : ${touched}`);
console.log(`   Posts sem alteração: ${skipped}`);
console.log(`   Total              : ${data.posts.length}`);
