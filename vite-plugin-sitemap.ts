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
const STATIC_PAGES = [
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
  return `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
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

function buildPageSitemap(today: string): string {
  const entries = STATIC_PAGES.map((page) =>
    buildUrlEntry(`${SITE_URL}${page.loc}`, today, page.changefreq, page.priority)
  );
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

function buildPostSitemap(posts: BlogPostJson[], today: string): string {
  const published = posts.filter((p) => p.status === "published");

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

      // ── page-sitemap.xml ──
      const pageSitemap = buildPageSitemap(today);
      const pagePath = path.join(resolvedOutDir, "page-sitemap.xml");
      fs.writeFileSync(pagePath, pageSitemap, "utf-8");
      console.log(`[sitemap] ✅ page-sitemap.xml gerado (${STATIC_PAGES.length} URLs)`);

      // ── post-sitemap.xml ──
      const posts = readBlogPosts(resolvedOutDir);
      const postSitemap = buildPostSitemap(posts, today);
      const postPath = path.join(resolvedOutDir, "post-sitemap.xml");
      fs.writeFileSync(postPath, postSitemap, "utf-8");
      const published = posts.filter((p) => p.status === "published").length;
      console.log(`[sitemap] ✅ post-sitemap.xml gerado (${published} posts publicados)`);

      // ── sitemap-index.xml ──
      const indexSitemap = buildSitemapIndex(today);
      const indexPath = path.join(resolvedOutDir, "sitemap-index.xml");
      fs.writeFileSync(indexPath, indexSitemap, "utf-8");
      console.log(`[sitemap] ✅ sitemap-index.xml gerado`);
    },
  };
}
