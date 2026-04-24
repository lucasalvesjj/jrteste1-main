// ──────────────────────────────────────────────
// Vite Plugin — SEO Settings Sync API (DEV only)
// + transformIndexHtml (DEV + BUILD)
// Grava seo-settings.json em disco durante o desenvolvimento.
// Injeta title/description no index.html no build final.
// ──────────────────────────────────────────────

import type { Plugin, ViteDevServer } from "vite";
import path from "path";
import fs from "fs";
import type { IncomingMessage } from "http";

function getSeoSettingsPath(root: string): string {
  return path.join(root, "public", "data", "seo-settings.json");
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function seoSyncPlugin(): Plugin {
  let root = "";

  return {
    name: "vite-plugin-seo-sync",

    configResolved(config) {
      root = config.root;
    },

    // ── Injeta title/description no HTML gerado (DEV + BUILD) ────────────────
    transformIndexHtml: {
      order: "pre",
      handler(html: string) {
        const filePath = getSeoSettingsPath(root);
        if (!fs.existsSync(filePath)) return html;
        try {
          const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
          let result = html;

          if (typeof data.homeTitle === "string" && data.homeTitle.trim()) {
            result = result.replace(
              /<title>[^<]*<\/title>/,
              `<title>${escapeHtml(data.homeTitle)}</title>`,
            );
          }

          if (typeof data.homeDescription === "string" && data.homeDescription.trim()) {
            result = result.replace(
              /(<meta name="description" content=")[^"]*(")/,
              `$1${escapeHtml(data.homeDescription)}$2`,
            );
          }

          return result;
        } catch {
          return html;
        }
      },
    },

    // ── API DEV: GET/PUT /api/seo-settings ────────────────────────────────────
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";

        // GET /api/seo-settings — lê do disco
        if (req.method === "GET" && url === "/api/seo-settings") {
          const filePath = getSeoSettingsPath(root);
          try {
            const data = fs.existsSync(filePath)
              ? fs.readFileSync(filePath, "utf-8")
              : "{}";
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(data);
          } catch (err: any) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // PUT /api/seo-settings — valida e grava no disco
        if (req.method === "PUT" && url === "/api/seo-settings") {
          try {
            const body = await readBody(req);
            const parsed = JSON.parse(body) as Record<string, unknown>;
            if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
              throw new Error("Invalid seo-settings data: expected an object");
            }

            // M3 — validação de tamanhos
            if (typeof parsed.homeTitle === "string" && parsed.homeTitle.length > 70) {
              res.writeHead(422, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "homeTitle excede 70 caracteres" }));
              return;
            }
            if (typeof parsed.homeDescription === "string" && parsed.homeDescription.length > 160) {
              res.writeHead(422, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "homeDescription excede 160 caracteres" }));
              return;
            }

            const filePath = getSeoSettingsPath(root);
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), "utf-8");
            console.log(`[seo-sync] seo-settings.json atualizado`);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
          } catch (err: any) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });

      console.log("\n🔍 SEO Sync API ativo (GET/PUT /api/seo-settings)");
    },
  };
}
