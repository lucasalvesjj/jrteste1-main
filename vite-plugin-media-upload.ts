// ──────────────────────────────────────────────
// Vite Plugin — Media Upload API (FIXED FINAL)
// ──────────────────────────────────────────────

import type { Plugin, ViteDevServer } from "vite";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import type { IncomingMessage } from "http";

// ── Sharp (lazy load compatível com ESM) ──
let sharp: any = null;

async function getSharp() {
  if (!sharp) {
    try {
      sharp = (await import("sharp")).default;
      console.log("\n📸 Media Upload API ativo (Sharp carregado)");
    } catch (err) {
      console.warn("\n⚠️ Sharp não disponível");
      throw err;
    }
  }
  return sharp;
}

// ── Tipos ──
interface MediaPaths {
  thumbnail: string;
  medium: string;
  large: string;
  original: string;
}

interface MediaItem {
  id: string;
  name: string;
  alt: string;
  paths: MediaPaths;
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

// ── Constantes ──
const VARIANT_CONFIG = {
  thumbnail: { width: 300, quality: 70 },
  medium: { width: 800, quality: 80 },
  large: { width: 1920, quality: 85 },
} as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ── Helpers ──
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generateId() {
  return crypto.randomUUID();
}

function getMediaDir(id: string) {
  const now = new Date();
  return `media/${now.getFullYear()}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${id}`;
}

function getCatalogPath(root: string) {
  return path.join(root, "public", "data", "media-library.json");
}

function readCatalog(p: string): MediaCatalog {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return { version: 1, updatedAt: "", items: [] };
  }
}

function writeCatalog(p: string, data: MediaCatalog) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

// ── ✅ PARSER MULTIPART CORRETO ──
async function parseMultipart(req: IncomingMessage): Promise<{
  file?: { buffer: Buffer; name: string };
}> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => chunks.push(chunk));

    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks);
        const contentType = req.headers["content-type"] || "";

        const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/);
        if (!boundaryMatch) {
          return reject(new Error("Boundary não encontrado"));
        }

        const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
        const parts: Buffer[] = [];

        let start = 0;

        while (true) {
          const index = body.indexOf(boundary, start);
          if (index === -1) break;

          if (start !== 0) {
            parts.push(body.subarray(start, index - 2));
          }

          start = index + boundary.length + 2;
        }

        for (const part of parts) {
          const headerEnd = part.indexOf("\r\n\r\n");
          if (headerEnd === -1) continue;

          const header = part.subarray(0, headerEnd).toString("utf-8");
          const content = part.subarray(headerEnd + 4);

          const filenameMatch = header.match(/filename="([^"]+)"/);

          if (filenameMatch) {
            return resolve({
              file: {
                buffer: content,
                name: filenameMatch[1],
              },
            });
          }
        }

        resolve({});
      } catch (err) {
        reject(err);
      }
    });

    req.on("error", reject);
  });
}

// ── Plugin ──
export function mediaUploadPlugin(): Plugin {
  let root = "";

  return {
    name: "media-upload",
    apply: "serve",

    configResolved(config) {
      root = config.root;
    },

    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";

        // STATUS
        if (url === "/api/media/status") {
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // UPLOAD
        if (req.method === "POST" && url === "/api/upload") {
          let sharpLib;
          try {
            sharpLib = await getSharp();
          } catch {
            res.writeHead(503);
            res.end(JSON.stringify({ error: "sharp não disponível" }));
            return;
          }

          try {
            const { file } = await parseMultipart(req);

            if (!file) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Nenhum arquivo enviado" }));
              return;
            }

            const buffer = file.buffer;

            if (buffer.length > MAX_FILE_SIZE) {
              throw new Error("Arquivo muito grande");
            }

            const id = generateId();
            const relDir = getMediaDir(id);
            const dir = path.join(root, "public", relDir);
            ensureDir(dir);

            const metadata = await sharpLib(buffer).metadata();

            for (const [name, cfg] of Object.entries(VARIANT_CONFIG)) {
              await sharpLib(buffer)
                .resize(cfg.width)
                .webp({ quality: cfg.quality })
                .toFile(path.join(dir, `${name}.webp`));
            }

            const original = path.join(dir, "original.jpg");
            fs.writeFileSync(original, buffer);

            const item: MediaItem = {
              id,
              name: file.name,
              alt: "",
              paths: {
                thumbnail: `/${relDir}/thumbnail.webp`,
                medium: `/${relDir}/medium.webp`,
                large: `/${relDir}/large.webp`,
                original: `/${relDir}/original.jpg`,
              },
              width: metadata.width || 0,
              height: metadata.height || 0,
              size: buffer.length,
              mimeType: "image/jpeg",
              uploadedAt: new Date().toISOString(),
              sourceType: "upload",
              sourceId: "",
            };

            const catalogPath = getCatalogPath(root);
            ensureDir(path.dirname(catalogPath));
            const catalog = readCatalog(catalogPath);
            catalog.items.unshift(item);
            writeCatalog(catalogPath, catalog);

            res.end(JSON.stringify(item));
          } catch (err: any) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }

          return;
        }

        next();
      });
    },
  };
}