/**
 * scripts/prerender.mjs
 * Pré-render SSG — captura HTML renderizado por rota e salva em dist/<rota>/index.html
 *
 * Uso isolado: node scripts/prerender.mjs
 * Uso programático: import { prerender } from "./prerender.mjs"
 *
 * Requer: Node >= 18, puppeteer instalado, dist/ gerado por vite build.
 */

import puppeteer from "puppeteer";
import { load } from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const PREVIEW_PORT = 4174;
const PREVIEW_HOST = "127.0.0.1";
const PREVIEW_BASE = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`;
const IS_WINDOWS = process.platform === "win32";

// Espelha STATIC_PAGES de vite-plugin-sitemap.ts (fonte canônica das rotas estáticas)
const STATIC_ROUTES = [
  "/",
  "/segmentos/",
  "/segmentos/assistencia-stihl/",
  "/segmentos/bombas-e-motores/",
  "/segmentos/ferramentas/",
  "/segmentos/irrigacao/",
  "/segmentos/locacao/",
  "/segmentos/maquinas/",
  "/segmentos/pocos-artesianos/",
  "/nossa-historia/",
  "/nossa-missao/",
  "/blog/",
  "/contato/",
  "/politica-de-privacidade/",
];

// ── Utilidades ────────────────────────────────────────────────────────────────

function log(msg)     { console.log(`  ${msg}`); }
function logOk(msg)   { console.log(`  [OK] ${msg}`); }
function logErr(msg)  { console.error(`  [ERRO] ${msg}`); }
function logWarn(msg) { console.log(`  [AVISO] ${msg}`); }

function getBlogRoutes() {
  const blogPath = path.join(ROOT, "public", "data", "blog-posts.json");
  if (!fs.existsSync(blogPath)) {
    logWarn("blog-posts.json não encontrado — pulando rotas de blog individual.");
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(blogPath, "utf-8"));
    const posts = (data.posts || []).filter(p => p.status === "published");
    log(`  ${posts.length} posts publicados encontrados.`);
    return posts.map(p => `/${encodeURI(p.slug)}/`);
  } catch {
    logWarn("blog-posts.json inválido — pulando rotas de blog individual.");
    return [];
  }
}

// ── Vite Preview ──────────────────────────────────────────────────────────────

function startPreviewServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "npx",
      ["vite", "preview", "--port", String(PREVIEW_PORT), "--strictPort", "--host", PREVIEW_HOST],
      { cwd: ROOT, stdio: "pipe", shell: IS_WINDOWS }
    );

    proc.on("error", err => reject(new Error(`spawn falhou: ${err.message}`)));
    proc.on("exit", code => {
      if (code !== 0 && code !== null) reject(new Error(`vite preview encerrou com código ${code}`));
    });

    const startTime = Date.now();
    const poll = setInterval(async () => {
      if (Date.now() - startTime > 15000) {
        clearInterval(poll);
        proc.kill("SIGKILL");
        reject(new Error("vite preview não iniciou em 15s."));
        return;
      }
      try {
        const r = await fetch(`${PREVIEW_BASE}/`);
        if (r.ok) {
          clearInterval(poll);
          resolve(proc);
        }
      } catch { /* aguardando servidor subir */ }
    }, 300);
  });
}

function killProcess(proc) {
  return new Promise(resolve => {
    if (!proc || proc.exitCode !== null) { resolve(); return; }
    proc.kill("SIGTERM");
    const t = setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} resolve(); }, 3000);
    proc.on("exit", () => { clearTimeout(t); resolve(); });
  });
}

// ── HTML ──────────────────────────────────────────────────────────────────────

/**
 * Remove tags duplicadas injetadas pelo react-helmet sobre o shell estático.
 * Problema: index.html tem <title> estático; helmet injeta outro sem remover o original.
 * Estratégia: manter sempre a ÚLTIMA ocorrência de cada tag única.
 */
function deduplicateHead(rawHtml) {
  const $ = load(rawHtml, { decodeEntities: false });

  // <title>: manter o último
  const titles = $("head title");
  if (titles.length > 1) titles.slice(0, -1).remove();

  // <meta name="...">: manter o último de cada name
  const byName = {};
  $("head meta[name]").each((_, el) => {
    const n = $(el).attr("name");
    if (!byName[n]) byName[n] = [];
    byName[n].push(el);
  });
  Object.values(byName).forEach(els => {
    if (els.length > 1) els.slice(0, -1).forEach(el => $(el).remove());
  });

  // <meta property="og:...">: manter o último de cada property
  const byProp = {};
  $("head meta[property]").each((_, el) => {
    const p = $(el).attr("property");
    if (!byProp[p]) byProp[p] = [];
    byProp[p].push(el);
  });
  Object.values(byProp).forEach(els => {
    if (els.length > 1) els.slice(0, -1).forEach(el => $(el).remove());
  });

  // <link rel="canonical">: manter o último
  const canonicals = $('head link[rel="canonical"]');
  if (canonicals.length > 1) canonicals.slice(0, -1).remove();

  return `<!doctype html>\n${$.html()}`;
}

function writeHtml(route, html) {
  // "/"          → dist/index.html
  // "/blog/"     → dist/blog/index.html
  // "/blog/slug/"→ dist/blog/slug/index.html
  const rel = route === "/"
    ? "index.html"
    : path.join(...route.replace(/^\/|\/$/g, "").split("/"), "index.html");
  const dest = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html, "utf-8");
}

// ── Função principal exportada ────────────────────────────────────────────────

export async function prerender() {
  const blogRoutesList = getBlogRoutes();
  const totalRoutes = STATIC_ROUTES.length + blogRoutesList.length;
  const report = { total: totalRoutes, succeeded: 0, failed: 0, schemaByRoute: {} };

  log(`Iniciando pré-render de ${totalRoutes} rotas...`);

  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    throw new Error("dist/index.html não encontrado — rode vite build antes.");
  }

  let previewProc;
  let browser;

  try {
    log("Subindo vite preview...");
    previewProc = await startPreviewServer();
    logOk(`vite preview em ${PREVIEW_BASE}`);

    // Sanity: verifica que blog-posts.json está sendo servido
    try {
      const r = await fetch(`${PREVIEW_BASE}/data/blog-posts.json`);
      if (!r.ok) logWarn(`blog-posts.json retornou ${r.status} no preview.`);
    } catch {
      logWarn("Não foi possível verificar blog-posts.json no preview.");
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const blogRoutes = blogRoutesList;
    const staticRoutes = STATIC_ROUTES;
    let rootFailed = false;

    // ── Captura helper ────────────────────────────────────────────────────────
    async function captureRoute(route, waitForSchemaPredicate) {
      // Aguarda schema via predicate customizável
      try {
        await page.waitForFunction(waitForSchemaPredicate, { timeout: 8000, polling: 100 });
      } catch {
        logWarn(`${route}: ld+json não encontrado em 8s (rota pode não ter schema).`);
      }
      const rawHtml = await page.evaluate(() => document.documentElement.outerHTML);
      const cleanHtml = deduplicateHead(rawHtml);
      const schemaCount = (cleanHtml.match(/application\/ld\+json/g) || []).length;
      report.schemaByRoute[route] = schemaCount;
      writeHtml(route, cleanHtml);
      logOk(`${route}  →  ${schemaCount} schema(s)`);
      report.succeeded++;
    }

    // ── 1. Rotas estáticas: full reload por rota ──────────────────────────────
    const schemaPresent = () => document.querySelectorAll('script[type="application/ld+json"]').length > 0;

    for (const route of staticRoutes) {
      try {
        await page.goto(`${PREVIEW_BASE}${route}`, { waitUntil: "networkidle2", timeout: 30000 });
        await captureRoute(route, schemaPresent);
      } catch (err) {
        logErr(`${route}: ${err.message}`);
        report.failed++;
        if (route === "/") rootFailed = true;
      }
    }

    if (rootFailed) {
      throw new Error("Falha na rota raiz '/' — schema.org da home não será gerado.");
    }

    // ── 2. Blog posts: SPA navigation (preserva module cache do usePublishedBlog) ──
    if (blogRoutes.length > 0) {
      // Aquece o cache navegando para /blog/ com full reload
      log("Aquecendo cache do blog para navegação SPA...");
      await page.goto(`${PREVIEW_BASE}/blog/`, { waitUntil: "networkidle2", timeout: 30000 });
      await page.waitForFunction(schemaPresent, { timeout: 8000, polling: 100 }).catch(() => {});

      // BlogPosting predicate: aguarda um ld+json com @type BlogPosting
      const blogPostingPresent = () => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const s of scripts) {
          try {
            const d = JSON.parse(s.textContent || "{}");
            if (d["@type"] === "BlogPosting") return true;
          } catch {}
        }
        return false;
      };

      for (const route of blogRoutes) {
        try {
          // Navega via SPA (history.pushState + popstate) — NÃO faz page reload
          // Isso preserva o module cache do usePublishedBlog carregado em /blog/
          await page.evaluate((r) => {
            window.history.pushState({}, "", r);
            window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
          }, route);

          await captureRoute(route, blogPostingPresent);
        } catch (err) {
          logErr(`${route}: ${err.message}`);
          report.failed++;
        }
      }
    }

  } finally {
    if (browser) await browser.close().catch(() => {});
    if (previewProc) await killProcess(previewProc);
  }

  return report;
}

// ── Execução direta ───────────────────────────────────────────────────────────

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  console.log("\n================================================");
  console.log("  PRÉ-RENDER SSG");
  console.log("================================================\n");

  prerender()
    .then(r => {
      console.log(`\n[OK] Concluído: ${r.succeeded}/${r.total} rotas — ${r.failed} falhas`);
      if (r.failed > 0) process.exit(1);
    })
    .catch(err => {
      console.error(`\n[FATAL] ${err.message}`);
      process.exit(1);
    });
}
