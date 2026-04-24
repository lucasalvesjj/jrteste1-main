// ──────────────────────────────────────────────
// Vite Plugin — SEO Settings Sync API (DEV only)
// Grava seo-settings.json em disco durante o desenvolvimento.
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

export function seoSyncPlugin(): Plugin {
  let root = "";

  return {
    name: "vite-plugin-seo-sync",
    apply: "serve",

    configResolved(config) {
      root = config.root;
    },

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

        // PUT /api/seo-settings — grava no disco
        if (req.method === "PUT" && url === "/api/seo-settings") {
          try {
            const body = await readBody(req);
            const parsed = JSON.parse(body);
            if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
              throw new Error("Invalid seo-settings data: expected an object");
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
