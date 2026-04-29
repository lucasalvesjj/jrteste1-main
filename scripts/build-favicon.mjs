// ─────────────────────────────────────────────────────────────────────────────
// build-favicon.mjs
// Gera public/favicon.ico multi-tamanho (16, 32, 48) a partir de favicon-base.png.
// Formato ICO com PNGs embutidos (suportado em todos os browsers modernos + Vista+).
// Dep: sharp (já instalado no projeto).
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public", "favicon-base.png");
const OUT = path.join(ROOT, "public", "favicon.ico");
const SIZES = [16, 32, 48];

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`[build-favicon] origem não encontrada: ${SRC}`);
    process.exit(1);
  }

  const pngs = await Promise.all(
    SIZES.map(async (s) => ({
      size: s,
      data: await sharp(SRC).resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    })),
  );

  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);            // reserved
  header.writeUInt16LE(1, 2);            // type 1 = icon
  header.writeUInt16LE(pngs.length, 4);  // image count

  // Directory entries: 16 bytes each
  const dirSize = 16 * pngs.length;
  let offset = 6 + dirSize;
  const dir = Buffer.alloc(dirSize);
  pngs.forEach((p, i) => {
    const o = i * 16;
    dir.writeUInt8(p.size === 256 ? 0 : p.size, o);     // width  (0 = 256)
    dir.writeUInt8(p.size === 256 ? 0 : p.size, o + 1); // height (0 = 256)
    dir.writeUInt8(0, o + 2);                            // color palette
    dir.writeUInt8(0, o + 3);                            // reserved
    dir.writeUInt16LE(1, o + 4);                         // color planes
    dir.writeUInt16LE(32, o + 6);                        // bits per pixel
    dir.writeUInt32LE(p.data.length, o + 8);             // size of image data
    dir.writeUInt32LE(offset, o + 12);                   // offset
    offset += p.data.length;
  });

  const ico = Buffer.concat([header, dir, ...pngs.map((p) => p.data)]);
  fs.writeFileSync(OUT, ico);
  console.log(`[build-favicon] gerado ${OUT} (${SIZES.join(", ")} px) — ${ico.length} bytes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
