// ─────────────────────────────────────────────────────────────────────────────
// build-og-image.mjs
// Gera public/og-image.jpg (1200x630) com SVG → JPEG via sharp.
// Texto em UTF-8 limpo (sem mojibake).
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "og-image.jpg");

const W = 1200;
const H = 630;

// SVG com texto UTF-8. Usar &#xXX; para caracteres acentuados garante que
// o parser do librsvg interprete corretamente sem depender de encoding.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#1a3c6e"/>
    </linearGradient>
  </defs>

  <!-- Fundo -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Logo / marca textual -->
  <g transform="translate(600, 130)" text-anchor="middle">
    <text font-family="Montserrat, Arial Black, sans-serif" font-weight="900"
          font-size="72" fill="#ffffff" letter-spacing="-1">
      COMERCIAL JR
    </text>
  </g>

  <!-- Linha divisória dourada -->
  <rect x="350" y="180" width="500" height="3" fill="#fbbf24"/>

  <!-- Título principal -->
  <g transform="translate(600, 290)" text-anchor="middle">
    <text font-family="Montserrat, Arial Black, sans-serif" font-weight="800"
          font-size="62" fill="#ffffff">
      Máquinas · Ferramentas · Irrigação
    </text>
  </g>

  <!-- Subtítulo -->
  <g transform="translate(600, 350)" text-anchor="middle">
    <text font-family="Open Sans, Arial, sans-serif" font-weight="500"
          font-size="32" fill="#e0e7ff">
      Castelo — Espírito Santo · 41 anos de tradição
    </text>
  </g>

  <!-- Pills de destaque -->
  <g transform="translate(600, 450)" text-anchor="middle">
    <!-- Pill 1 -->
    <g transform="translate(-340, 0)">
      <rect x="-130" y="-30" width="260" height="60" rx="30" fill="#fbbf24"/>
      <text font-family="Montserrat, Arial, sans-serif" font-weight="700"
            font-size="26" fill="#1a3c6e" y="9">18.000+ produtos</text>
    </g>
    <!-- Pill 2 -->
    <g transform="translate(0, 0)">
      <rect x="-130" y="-30" width="260" height="60" rx="30" fill="#fbbf24"/>
      <text font-family="Montserrat, Arial, sans-serif" font-weight="700"
            font-size="26" fill="#1a3c6e" y="9">Revenda STIHL</text>
    </g>
    <!-- Pill 3 -->
    <g transform="translate(340, 0)">
      <rect x="-130" y="-30" width="260" height="60" rx="30" fill="#fbbf24"/>
      <text font-family="Montserrat, Arial, sans-serif" font-weight="700"
            font-size="26" fill="#1a3c6e" y="9">Frete grátis ES</text>
    </g>
  </g>

  <!-- URL -->
  <g transform="translate(600, 575)" text-anchor="middle">
    <text font-family="Open Sans, Arial, sans-serif" font-weight="600"
          font-size="28" fill="#ffffff">
      comercialjrltda.com.br
    </text>
  </g>
</svg>`;

async function main() {
  await sharp(Buffer.from(svg, "utf-8"))
    .jpeg({ quality: 88, progressive: true, chromaSubsampling: "4:4:4" })
    .toFile(OUT);

  const stat = fs.statSync(OUT);
  console.log(`[build-og-image] gerado ${OUT} — ${W}x${H}, ${stat.size} bytes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
