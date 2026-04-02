/**
 * Script para processar imagens dos segmentos pelo pipeline Sharp.
 * Gera variantes (thumbnail, medium, large) em WebP + preserva original.
 * Atualiza media-library.json com entradas SEO-otimizadas.
 */
import sharp from "sharp";
import { randomUUID } from "crypto";
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { join, basename } from "path";

const PROJECT = process.cwd();
const MEDIA_BASE = join(PROJECT, "public", "media", "2026", "04");
const CATALOG_PATH = join(PROJECT, "public", "data", "media-library.json");

const VARIANTS = {
  thumbnail: { width: 300,  quality: 70 },
  medium:    { width: 800,  quality: 80 },
  large:     { width: 1920, quality: 85 },
};

const IMAGES = [
  {
    src: String.raw`C:\Users\lucas\OneDrive\Documents\SITE JR BACKUPS\Bombas e Motores-2.png`,
    alt: "Bombas centrífugas e motores elétricos para irrigação e abastecimento - Comercial JR Castelo ES",
    sourceId: "bombas-e-motores",
    segment: "Bombas e Motores",
  },
  {
    src: String.raw`C:\Users\lucas\OneDrive\Documents\SITE JR BACKUPS\Locação de Máquinas-1.png`,
    alt: "Equipamentos para locação em obras e reformas - compactador, martelo rompedor e perfurador - Comercial JR",
    sourceId: "locacao",
    segment: "Locação de Equipamentos",
  },
  {
    src: String.raw`C:\Users\lucas\OneDrive\Documents\SITE JR BACKUPS\Poco Artesiano-2.png`,
    alt: "Soluções para poços artesianos - bombas submersas e painéis de controle - Comercial JR Castelo ES",
    sourceId: "pocos-artesianos",
    segment: "Poços Artesianos",
  },
  {
    src: String.raw`C:\Users\lucas\OneDrive\Documents\SITE JR BACKUPS\Ferramentas Manuais-3.png`,
    alt: "Ferramentas manuais profissionais Gedore, MTX e Foxlux para construção e serralheria - Comercial JR",
    sourceId: "ferramentas",
    segment: "Ferramentas Manuais",
  },
  {
    src: String.raw`C:\Users\lucas\OneDrive\Documents\SITE JR BACKUPS\Máquinas Elétricas-3.png`,
    alt: "Máquinas elétricas profissionais - furadeiras, esmerilhadeiras e serras DeWalt e Bosch - Comercial JR",
    sourceId: "maquinas",
    segment: "Máquinas Elétricas",
  },
  {
    src: String.raw`C:\Users\lucas\OneDrive\Documents\SITE JR BACKUPS\Irrigação Agrícola-1.png`,
    alt: "Sistema de irrigação agrícola por aspersão e gotejamento para lavouras - Comercial JR Castelo ES",
    sourceId: "irrigacao",
    segment: "Irrigação Agrícola",
  },
  {
    src: String.raw`C:\Users\lucas\OneDrive\Documents\SITE JR BACKUPS\Assistência Técnica Stihl-1.png`,
    alt: "Assistência técnica autorizada STIHL - manutenção com peças originais e garantia de fábrica - Comercial JR",
    sourceId: "assistencia-stihl",
    segment: "Assistência Técnica STIHL",
  },
];

// Carregar catálogo existente
const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf-8"));
const results = [];

for (const img of IMAGES) {
  const id = randomUUID();
  const dir = join(MEDIA_BASE, id);
  mkdirSync(dir, { recursive: true });

  const originalName = basename(img.src);
  const originalExt = originalName.split(".").pop();

  // Copiar original
  copyFileSync(img.src, join(dir, `original.${originalExt}`));

  // Ler imagem com Sharp para obter dimensões
  const metadata = await sharp(img.src).metadata();
  const fileSize = readFileSync(img.src).length;

  // Gerar variantes WebP
  for (const [variant, config] of Object.entries(VARIANTS)) {
    await sharp(img.src)
      .resize({ width: config.width, withoutEnlargement: true })
      .webp({ quality: config.quality })
      .toFile(join(dir, `${variant}.webp`));
  }

  // Criar entrada no catálogo
  const entry = {
    id,
    name: originalName,
    alt: img.alt,
    paths: {
      thumbnail: `/media/2026/04/${id}/thumbnail.webp`,
      medium: `/media/2026/04/${id}/medium.webp`,
      large: `/media/2026/04/${id}/large.webp`,
      original: `/media/2026/04/${id}/original.${originalExt}`,
    },
    width: metadata.width,
    height: metadata.height,
    size: fileSize,
    mimeType: `image/${originalExt === "png" ? "png" : "jpeg"}`,
    uploadedAt: new Date().toISOString(),
    sourceType: "page",
    sourceId: img.sourceId,
  };

  catalog.items.push(entry);
  results.push({ segment: img.segment, id, sourceId: img.sourceId, largePath: entry.paths.large, alt: img.alt });

  console.log(`OK: ${img.segment} -> /media/2026/04/${id}/`);
}

// Salvar catálogo atualizado
catalog.updatedAt = new Date().toISOString();
writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), "utf-8");

// Salvar mapeamento para uso na Etapa 4
writeFileSync(
  join(PROJECT, "scripts", "segment-image-map.json"),
  JSON.stringify(results, null, 2),
  "utf-8"
);

console.log("\nTodas as 7 imagens processadas. Mapeamento salvo em scripts/segment-image-map.json");
