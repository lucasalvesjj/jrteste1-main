// ─────────────────────────────────────────────────────────────────────────────
// Vite Plugin — Route SEO (BUILD only)
//
// Para cada rota em public/data/route-seo.json, e para cada post publicado em
// public/data/blog-posts.json, gera dist/<rota>/index.html com <head> completo:
//   title, description, canonical, og:*, twitter:*, JSON-LD
//
// O Cloudflare Pages serve o arquivo estático antes do fallback SPA,
// entregando metadata para crawlers que não executam JS (Twitter, Facebook, etc.)
// ─────────────────────────────────────────────────────────────────────────────

import type { Plugin } from "vite";
import path from "path";
import fs from "fs";
import {
  buildBreadcrumb,
  buildService,
  buildWebPage,
  buildWebSite,
  buildLocalBusiness,
  buildArticle,
  buildFAQPage,
  type BreadcrumbItem,
  type ServiceData,
  type WebPageData,
  type ArticleData,
  type FAQItem,
} from "./src/lib/seo/schemas";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface RouteEntry {
  path: string;
  title: string;
  description: string;
  ogImage?: string;
  ogType?: string;
  schemas: string[];
  breadcrumb?: BreadcrumbItem[];
  service?: ServiceData;
  webpage?: WebPageData;
  article?: ArticleData;
  faq?: FAQItem[];
}

interface BlogPost {
  slug: string;
  title: string;
  status: string;
  date: string;
  updatedAt?: string;
  image?: string;
  faq?: FAQItem[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage?: string;
    ogType?: string;
    canonical?: string;
    robots?: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SITE_URL = "https://comercialjrltda.com.br";

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildSchemas(route: RouteEntry): object[] {
  const out: object[] = [];
  for (const s of route.schemas) {
    switch (s) {
      case "localBusiness":
        out.push(buildLocalBusiness());
        break;
      case "website":
        out.push(buildWebSite());
        break;
      case "breadcrumb":
        if (route.breadcrumb) out.push(buildBreadcrumb(route.breadcrumb));
        break;
      case "service":
        if (route.service) out.push(buildService(route.service));
        break;
      case "webpage":
        if (route.webpage) out.push(buildWebPage(route.webpage));
        break;
      case "article":
        if (route.article) out.push(buildArticle(route.article));
        break;
      case "faqPage":
        if (route.faq && route.faq.length > 0) out.push(buildFAQPage(route.faq));
        break;
    }
  }
  return out;
}

function buildRouteHtml(shell: string, route: RouteEntry): string {
  const title = escapeAttr(route.title);
  const desc  = escapeAttr(route.description);
  const url   = `${SITE_URL}${route.path}`;
  const rawImage = route.ogImage ?? "/og-image.jpg";
  const image = rawImage.startsWith("http") ? rawImage : `${SITE_URL}${rawImage}`;
  const ogType = route.ogType ?? "website";

  let html = shell;

  // Usar funções de substituição para evitar interpretação de $$ como $ especial do replace
  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*"/, (_m, g1: string) => `${g1}${desc}"`);

  // Tags a injetar antes de </head>
  const inject = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:site_name" content="Comercial JR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    ...buildSchemas(route).map(
      (schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
    ),
  ].join("\n  ");

  html = html.replace("</head>", () => `  ${inject}\n</head>`);
  return html;
}

function writeRouteFile(outDir: string, routePath: string, html: string): void {
  const clean = routePath.replace(/^\/|\/$/g, "");
  const dir   = clean ? path.join(outDir, clean) : outDir;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
}

function postToRoute(post: BlogPost): RouteEntry {
  const canonical = post.seo.canonical || `/blog/${post.slug}/`;
  const rawImage  = post.seo.ogImage || post.image;
  return {
    path: canonical,
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    ogImage: rawImage,
    ogType: "article",
    schemas: post.faq && post.faq.length > 0 ? ["article", "breadcrumb", "faqPage"] : ["article", "breadcrumb"],
    faq: post.faq,
    article: {
      headline: post.seo.metaTitle.replace(" | Comercial JR", ""),
      description: post.seo.metaDescription,
      ...(rawImage ? { image: rawImage } : {}),
      datePublished: post.date,
      ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
      author: "Comercial JR",
      url: canonical,
    },
    breadcrumb: [
      { name: "Início", url: "/" },
      { name: "Blog", url: "/blog/" },
      { name: post.title, url: canonical },
    ],
  };
}

// ── Plugin ────────────────────────────────────────────────────────────────────

export function routeSeoPlugin(): Plugin {
  let root   = "";
  let outDir = "dist";

  return {
    name: "vite-plugin-route-seo",

    configResolved(config) {
      root   = config.root;
      outDir = path.resolve(root, config.build.outDir ?? "dist");
    },

    closeBundle() {
      const shellPath = path.join(outDir, "index.html");
      if (!fs.existsSync(shellPath)) return;

      const shell = fs.readFileSync(shellPath, "utf-8");

      // Rotas estáticas
      const routeSeoPath = path.join(root, "public", "data", "route-seo.json");
      if (!fs.existsSync(routeSeoPath)) {
        console.warn("[route-seo] public/data/route-seo.json não encontrado — pulando.");
        return;
      }
      const routes: RouteEntry[] = JSON.parse(fs.readFileSync(routeSeoPath, "utf-8"));

      let count = 0;
      for (const route of routes) {
        writeRouteFile(outDir, route.path, buildRouteHtml(shell, route));
        count++;
      }

      // Posts do blog
      const blogPath = path.join(root, "public", "data", "blog-posts.json");
      if (fs.existsSync(blogPath)) {
        const raw = JSON.parse(fs.readFileSync(blogPath, "utf-8"));
        const posts: BlogPost[] = Array.isArray(raw) ? raw : (raw.posts ?? []);
        for (const post of posts) {
          if (post.status !== "published") continue;
          const route = postToRoute(post);
          writeRouteFile(outDir, route.path, buildRouteHtml(shell, route));
          count++;
        }
      }

      console.log(`[route-seo] ${count} arquivos HTML gerados em ${outDir}`);
    },
  };
}
