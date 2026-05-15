/**
 * vite-plugin-sitemap.ts
 * Gera page-sitemap.xml, post-sitemap.xml e sitemap-index.xml durante o build.
 * Os arquivos são gravados em /dist (outDir configurado no vite.config.ts).
 *
 * page-sitemap.xml  → lista todas as páginas estáticas do site
 * post-sitemap.xml  → lê /public/data/blog-posts.json e lista posts publicados
 * sitemap-index.xml → índice consolidado dos dois sitemaps acima (padrão Google)
 */

import type { Plugin } from "vite";
import fs from "fs";
import path from "path";

const SITE_URL = "https://comercialjrltda.com.br";

// Páginas estáticas com prioridade e frequência de mudança
export const STATIC_PAGES = [
  { loc: "/",                         changefreq: "weekly",  priority: "1.0" },
  { loc: "/segmentos/",               changefreq: "monthly", priority: "0.8" },
  { loc: "/segmentos/assistencia-stihl/", changefreq: "monthly", priority: "0.8" },
  { loc: "/segmentos/bombas-e-motores/",  changefreq: "monthly", priority: "0.8" },
  { loc: "/segmentos/ferramentas/",       changefreq: "monthly", priority: "0.8" },
  { loc: "/segmentos/irrigacao/",         changefreq: "monthly", priority: "0.8" },
  { loc: "/segmentos/locacao/",           changefreq: "monthly", priority: "0.8" },
  { loc: "/segmentos/maquinas/",          changefreq: "monthly", priority: "0.8" },
  { loc: "/segmentos/pocos-artesianos/",  changefreq: "monthly", priority: "0.8" },
  { loc: "/nossa-historia/",          changefreq: "yearly",  priority: "0.5" },
  { loc: "/nossa-missao/",            changefreq: "yearly",  priority: "0.5" },
  { loc: "/blog/",                    changefreq: "daily",   priority: "0.9" },
  { loc: "/contato/",                 changefreq: "yearly",  priority: "0.6" },
  { loc: "/politica-de-privacidade/", changefreq: "yearly",  priority: "0.3" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildXmlHeader(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
}

function buildUrlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string
): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function buildPageSitemap(today: string, excludedUrls?: Set<string>, redirectTargets?: { loc: string; changefreq: string; priority: string }[]): string {
  const pages = excludedUrls
    ? STATIC_PAGES.filter((page) => !excludedUrls.has(page.loc) && !excludedUrls.has(page.loc.replace(/\/$/, "")))
    : STATIC_PAGES;
  const entries = pages.map((page) =>
    buildUrlEntry(`${SITE_URL}${page.loc}`, today, page.changefreq, page.priority)
  );

  // Adicionar URLs de destino de 301 que não estão já no sitemap
  if (redirectTargets) {
    const existingLocs = new Set(pages.map((p) => p.loc));
    for (const target of redirectTargets) {
      if (!existingLocs.has(target.loc)) {
        entries.push(buildUrlEntry(`${SITE_URL}${target.loc}`, today, target.changefreq, target.priority));
        existingLocs.add(target.loc);
      }
    }
  }

  return [buildXmlHeader(), ...entries, "</urlset>"].join("\n");
}
interface BlogPostJson {
  slug: string;
  date: string;
  status: string;
}

interface BlogCatalog {
  posts: BlogPostJson[];
}

interface RedirectRuleJson {
  sourceUrl: string;
  targetUrl: string;
  type: number;
  isRegex: boolean;
  enabled: boolean;
}

interface RedirectCatalog {
  rules: RedirectRuleJson[];
}

function readRedirectRules(outDir: string): RedirectRuleJson[] {
  const candidates = [
    path.join(outDir, "data", "redirects.json"),
    path.join(process.cwd(), "public", "data", "redirects.json"),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw) as RedirectCatalog;
        if (Array.isArray(parsed.rules)) return parsed.rules;
      } catch {
        // continua
      }
    }
  }
  return [];
}

/** Coleta URLs que devem ser excluídas do sitemap (410s e fontes de redirect) */
function getExcludedUrls(outDir: string): Set<string> {
  const rules = readRedirectRules(outDir);
  const excluded = new Set<string>();

  for (const rule of rules) {
    if (!rule.enabled || rule.isRegex) continue; // regex não pode ser comparado como URL literal
    // Normaliza: adiciona / no in��cio e final para comparação
    const source = rule.sourceUrl.startsWith("/") ? rule.sourceUrl : `/${rule.sourceUrl}`;
    const withTrailing = source.endsWith("/") ? source : `${source}/`;
    const withoutTrailing = withTrailing.slice(0, -1);
    excluded.add(withTrailing);
    excluded.add(withoutTrailing);
  }

  return excluded;
}

/** Coleta URLs de destino internas de regras 301 para inclusão no sitemap */
function getRedirectTargetUrls(outDir: string): { loc: string; changefreq: string; priority: string }[] {
  const rules = readRedirectRules(outDir);
  const targets: { loc: string; changefreq: string; priority: string }[] = [];

  for (const rule of rules) {
    if (!rule.enabled || rule.isRegex || rule.type !== 301) continue;
    const target = rule.targetUrl;
    // Só URLs internas (não absolutas externas)
    if (!target || target.startsWith("http")) continue;
    const normalized = target.startsWith("/") ? target : `/${target}`;
    const withTrailing = normalized.endsWith("/") ? normalized : `${normalized}/`;
    targets.push({ loc: withTrailing, changefreq: "weekly", priority: "0.6" });
  }

  return targets;
}

function readBlogPosts(outDir: string): BlogPostJson[] {
  const candidates = [
    path.join(outDir, "data", "blog-posts.json"),
    path.join(process.cwd(), "public", "data", "blog-posts.json"),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw) as BlogCatalog | BlogPostJson[];
        // Suporta tanto array direto quanto { posts: [...] }
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.posts)) return parsed.posts;
      } catch {
        // continua para o próximo candidato
      }
    }
  }
  return [];
}

function buildPostSitemap(posts: BlogPostJson[], today: string, excludedUrls?: Set<string>): string {
  let published = posts.filter((p) => p.status === "published");

  if (excludedUrls) {
    published = published.filter((post) => {
      const url = `/${post.slug}/`;
      return !excludedUrls.has(url) && !excludedUrls.has(`/${post.slug}`);
    });
  }

  const entries = published.map((post) => {
    const lastmod = post.date ? post.date.slice(0, 10) : today;
    return buildUrlEntry(
      `${SITE_URL}/${post.slug}/`,
      lastmod,
      "weekly",
      "0.7"
    );
  });

  return [buildXmlHeader(), ...entries, "</urlset>"].join("\n");
}

function buildSitemapIndex(today: string): string {
  const sitemaps = ["page-sitemap.xml", "post-sitemap.xml"];
  const entries = sitemaps.map(
    (name) =>
      `  <sitemap>\n    <loc>${SITE_URL}/${name}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries,
    `</sitemapindex>`,
  ].join("\n");
}

export function sitemapPlugin(): Plugin {
  let resolvedOutDir = "dist";

  return {
    name: "vite-plugin-sitemap",
    apply: "build",

    configResolved(config) {
      resolvedOutDir = config.build.outDir ?? "dist";
    },

    closeBundle() {
      const today = new Date().toISOString().slice(0, 10);

      // ── URLs excluídas por regras de redirect/410 ──
      const excludedUrls = getExcludedUrls(resolvedOutDir);
      if (excludedUrls.size > 0) {
        console.log(`[sitemap] ${excludedUrls.size / 2} URLs excluídas por regras de redirect/410`);
      }

      // ── URLs de destino de 301 para inclusão ──
      const redirectTargets = getRedirectTargetUrls(resolvedOutDir);
      if (redirectTargets.length > 0) {
        console.log(`[sitemap] ${redirectTargets.length} URLs de destino de 301 adicionadas ao sitemap`);
      }

      // ── page-sitemap.xml ──
      const pageSitemap = buildPageSitemap(today, excludedUrls, redirectTargets);
      const pagePath = path.join(resolvedOutDir, "page-sitemap.xml");
      fs.writeFileSync(pagePath, pageSitemap, "utf-8");
      console.log(`[sitemap] page-sitemap.xml gerado (${STATIC_PAGES.length} URLs)`);

      // ── post-sitemap.xml ──
      const posts = readBlogPosts(resolvedOutDir);
      const postSitemap = buildPostSitemap(posts, today, excludedUrls);
      const postPath = path.join(resolvedOutDir, "post-sitemap.xml");
      fs.writeFileSync(postPath, postSitemap, "utf-8");
      const published = posts.filter((p) => p.status === "published").length;
      console.log(`[sitemap] post-sitemap.xml gerado (${published} posts publicados)`);

      // ── sitemap-index.xml ──
      const indexSitemap = buildSitemapIndex(today);
      const indexPath = path.join(resolvedOutDir, "sitemap-index.xml");
      fs.writeFileSync(indexPath, indexSitemap, "utf-8");
      console.log(`[sitemap] ✅ sitemap-index.xml gerado`);
    },
  };
}
