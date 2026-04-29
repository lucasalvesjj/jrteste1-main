// ─────────────────────────────────────────────────────────────────────────────
// build-og-image.mjs
// Gera public/og-image-v2.jpg (1200x630) com SVG → JPEG via sharp.
// Texto em UTF-8 limpo (sem mojibake).
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const LOGO_SRC = path.join(ROOT, "public", "favicon-base.png");
const OUT = path.join(ROOT, "public", "og-image-v2.jpg");

const W = 1200;
const H = 630;
const LOGO_SIZE = 260; // brasão JR redimensionado

// Fundo azul com texto à direita do brasão
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f2560"/>
    </linearGradient>
  </defs>

  <!-- Fundo -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Linha dourada vertical separando logo do texto -->
  <rect x="420" y="80" width="4" height="470" rx="2" fill="#fbbf24" opacity="0.7"/>

  <!-- Texto — lado direito (x=460) -->

  <!-- Nome da empresa -->
  <text x="468" y="195"
        font-family="Montserrat, Arial Black, sans-serif"
        font-weight="900" font-size="74" fill="#ffffff"
        letter-spacing="-1">COMERCIAL JR</text>

  <!-- Linha dourada abaixo do nome -->
  <rect x="468" y="218" width="680" height="4" rx="2" fill="#fbbf24"/>

  <!-- Tagline -->
  <text x="468" y="285"
        font-family="Open Sans, Arial, sans-serif"
        font-weight="600" font-size="36" fill="#bfdbfe">
    Irrigação · Bombas · Ferramentas
  </text>

  <!-- Localização -->
  <text x="468" y="340"
        font-family="Open Sans, Arial, sans-serif"
        font-weight="400" font-size="28" fill="#93c5fd">
    Castelo — Espírito Santo
  </text>

  <!-- Pills -->
  <g transform="translate(468, 405)">
    <!-- Pill 1 -->
    <rect x="0" y="0" width="200" height="52" rx="26" fill="#fbbf24"/>
    <text x="100" y="33" text-anchor="middle"
          font-family="Montserrat, Arial, sans-serif"
          font-weight="700" font-size="22" fill="#1a3c6e">18.000+ produtos</text>

    <!-- Pill 2 -->
    <rect x="216" y="0" width="174" height="52" rx="26" fill="#fbbf24"/>
    <text x="303" y="33" text-anchor="middle"
          font-family="Montserrat, Arial, sans-serif"
          font-weight="700" font-size="22" fill="#1a3c6e">Revenda STIHL</text>

    <!-- Pill 3 -->
    <rect x="406" y="0" width="178" height="52" rx="26" fill="#fbbf24"/>
    <text x="495" y="33" text-anchor="middle"
          font-family="Montserrat, Arial, sans-serif"
          font-weight="700" font-size="22" fill="#1a3c6e">Frete grátis ES</text>
  </g>

  <!-- URL no rodapé -->
  <text x="468" y="575"
        font-family="Open Sans, Arial, sans-serif"
        font-weight="600" font-size="26" fill="#93c5fd">
    comercialjrltda.com.br
  </text>
</svg>`;

async function main() {
  if (!fs.existsSync(LOGO_SRC)) {
    console.error(`[build-og-image] favicon-base.png não encontrado: ${LOGO_SRC}`);
    process.exit(1);
  }

  // Redimensiona o brasão e garante canal alpha
  const logoBuffer = await sharp(LOGO_SRC)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Logo centralizado verticalmente na metade esquerda (x=80 a x=420, center = 250)
  const logoLeft = Math.round((420 - LOGO_SIZE) / 2); // ~80px
  const logoTop  = Math.round((H - LOGO_SIZE) / 2);   // ~185px

  const background = await sharp(Buffer.from(svg, "utf-8"))
    .png()
    .toBuffer();

  await sharp(background)
    .composite([{ input: logoBuffer, left: logoLeft, top: logoTop }])
    .jpeg({ quality: 90, progressive: true, chromaSubsampling: "4:4:4" })
    .toFile(OUT);

  const stat = fs.statSync(OUT);
  console.log(`[build-og-image] gerado ${OUT} — ${W}x${H}, ${stat.size} bytes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
