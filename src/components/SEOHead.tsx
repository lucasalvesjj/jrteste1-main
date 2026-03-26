import { Helmet } from "react-helmet-async";
import { company } from "@/data/company";

// ── GlobalSEO helpers (lê do localStorage) ──────────────────────────────────
const SEO_STORAGE_KEY = "comercial-jr-global-seo";

function getGlobalSeoValue<K extends string>(key: K, fallback: string): string {
  try {
    const raw = localStorage.getItem(SEO_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed[key] === "string" ? (parsed[key] as string) : fallback;
  } catch {
    return fallback;
  }
}

// ── Tipos ────────────────────────────────────────────────────────────────────
interface ArticleMeta {
  publishedTime?: string;
  section?: string;
  tags?: string[];
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  type?: string;
  robots?: string;
  article?: ArticleMeta;
}

// ── Componente ───────────────────────────────────────────────────────────────
const SEOHead = ({
  title,
  description,
  canonical,
  ogImage,
  ogImageWidth = 1200,
  ogImageHeight = 630,
  type = "website",
  robots,
  article,
}: SEOHeadProps) => {
  const fullTitle = title ? `${title} | ${company.shortName}` : company.seo.title;
  const desc      = description || company.seo.description;
  const url       = canonical ? `${company.siteUrl}${canonical}` : company.siteUrl;
  // Homepage: usa defaultImage do admin; posts: imagem do post; outras páginas estáticas: favicon
  const isHomepage = !canonical || canonical === "/";
  const adminDefaultImage = isHomepage
    ? getGlobalSeoValue("defaultImage", company.seo.image)
    : null;
  const resolvedImage = ogImage ?? adminDefaultImage ?? "/favicon.webp";
  const image = resolvedImage.startsWith("http")
    ? resolvedImage
    : `${company.siteUrl}${resolvedImage}`;

  // Valores globais do admin (localStorage)
  const googleVerification = getGlobalSeoValue("googleVerification", "da794cd9937527d01");
  const themeColor         = getGlobalSeoValue("themeColor", "#1a3c6e");
  const ogLocale           = getGlobalSeoValue("ogLocale", "pt_BR");
  const referrerPolicy     = getGlobalSeoValue("referrerPolicy", "no-referrer-when-downgrade");

  // Robots: prop explícita tem prioridade; senão usa o padrão global ou index,follow
  const robotsContent = robots
    ?? getGlobalSeoValue("defaultRobots", "index,follow");

  return (
    <Helmet>
      {/* ── Básico ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content={robotsContent} />
      <meta name="referrer" content={referrerPolicy} />
      <link rel="canonical" href={url} />

      {/* ── hreflang ── */}
      <link rel="alternate" hreflang="pt-BR"    href={url} />
      <link rel="alternate" hreflang="x-default" href={url} />

      {/* ── Google Search Console (só na homepage) ── */}
      {(!canonical || canonical === "/") && googleVerification && (
        <meta name="google-site-verification" content={googleVerification} />
      )}

      {/* ── PWA / Mobile ── */}
      <meta name="theme-color" content={themeColor} />

      {/* ── Open Graph ── */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url"         content={url} />
      <meta property="og:image"       content={image} />
      <meta property="og:image:width"  content={String(ogImageWidth)} />
      <meta property="og:image:height" content={String(ogImageHeight)} />
      <meta property="og:type"        content={type} />
      <meta property="og:locale"      content={ogLocale} />
      <meta property="og:site_name"   content={company.name} />

      {/* ── Article específico ── */}
      {article && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.section && (
            <meta property="article:section" content={article.section} />
          )}
          {article.tags?.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* ── Performance: prefetch / preconnect ── */}
      <link rel="dns-prefetch"  href="//fonts.googleapis.com" />
      <link rel="dns-prefetch"  href="//fonts.gstatic.com" />
      <link rel="preconnect"    href="https://fonts.googleapis.com" />
      <link rel="preconnect"    href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
};

export default SEOHead;
