// ──────────────────────────────────────────────
// Vite Plugin — Redirect Sync API (DEV only)
// Grava redirects.json em disco durante o desenvolvimento.
// ──────────────────────────────────────────────

import type { Plugin, ViteDevServer } from "vite";
import path from "path";
import fs from "fs";
import type { IncomingMessage } from "http";

function getRedirectsPath(root: string): string {
  return path.join(root, "public", "data", "redirects.json");
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

export function redirectSyncPlugin(): Plugin {
  let root = "";

  return {
    name: "vite-plugin-redirect-sync",
    apply: "serve",

    configResolved(config) {
      root = config.root;
    },

    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";

        // GET /api/redirects — lê do disco
        if (req.method === "GET" && url === "/api/redirects") {
          const filePath = getRedirectsPath(root);
          try {
            const data = fs.existsSync(filePath)
              ? fs.readFileSync(filePath, "utf-8")
              : JSON.stringify({ version: 1, exportedAt: "", rules: [], notFoundLog: [], groups: [] });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(data);
          } catch (err: any) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // PUT /api/redirects — grava no disco
        if (req.method === "PUT" && url === "/api/redirects") {
          try {
            const body = await readBody(req);
            const parsed = JSON.parse(body);
            if (!Array.isArray(parsed.rules)) {
              throw new Error("Invalid redirects data: missing rules array");
            }

            const filePath = getRedirectsPath(root);
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), "utf-8");
            console.log(`[redirect-sync] redirects.json atualizado (${parsed.rules.length} regras)`);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, rulesCount: parsed.rules.length }));
          } catch (err: any) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });

      console.log("\n🔀 Redirect Sync API ativo (GET/PUT /api/redirects)");
    },
  };
}
