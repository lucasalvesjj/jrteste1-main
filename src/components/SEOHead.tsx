import { Helmet } from "react-helmet-async";
import { company } from "@/data/company";
import { usePublishedSeoContext } from "@/contexts/PublishedSeoContext";

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
  const seo = usePublishedSeoContext();

  const isHomepage = !canonical || canonical === "/";
  const shortName  = seo.companyName || company.shortName;
  const homeTitle  = seo.homeTitle || company.seo.title;
  const homeDesc   = seo.homeDescription || company.seo.description;

  const fullTitle = title
    ? `${title} | ${shortName}`
    : (isHomepage ? homeTitle : company.seo.title);
  const desc = description || (isHomepage ? homeDesc : company.seo.description);
  const url       = canonical ? `${company.siteUrl}${canonical}` : company.siteUrl;
  const publishedDefaultImage = isHomepage ? (seo.ogImage || company.seo.image) : null;
  const resolvedImage = ogImage ?? publishedDefaultImage ?? "/og-image-v2.jpg";
  const image = resolvedImage.startsWith("http")
    ? resolvedImage
    : `${company.siteUrl}${resolvedImage}`;

  // Valores globais do JSON publicado (sem localStorage)
  const googleVerification = seo.googleSiteVerification || "da794cd9937527d01";
  const themeColor         = seo.themeColor || "#1a3c6e";
  const ogLocale           = seo.ogLocale || "pt_BR";
  const referrerPolicy     = seo.referrerPolicy || "no-referrer-when-downgrade";

  // Robots: prop explícita tem prioridade; senão usa o padrão global ou index,follow
  const robotsContent = robots ?? (seo.robotsDefault || "index,follow");

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
      <meta property="og:site_name"   content={seo.companyName || company.name} />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={image} />

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

      {/* Preconnect/dns-prefetch removidos — já declarados no index.html */}
    </Helmet>
  );
};

export default SEOHead;
