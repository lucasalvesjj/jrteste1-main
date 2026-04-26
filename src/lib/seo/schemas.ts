/**
 * Builders Schema.org — framework-agnostic, importáveis em Node.js (plugin) e browser (React).
 * Fonte única de verdade para todos os JSON-LD do projeto.
 */

const SITE_URL = "https://comercialjrltda.com.br";
const ORG_ID   = `${SITE_URL}/#organization`;

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ServiceData {
  name: string;
  description: string;
  url: string;
}

export interface WebPageData {
  name: string;
  description: string;
  url: string;
}

export interface ArticleData {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

// ── Builders ───────────────────────────────────────────────────────────────────

function abs(url: string): string {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

export function buildBreadcrumb(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: abs(item.url),
    })),
  };
}

export function buildService(data: ServiceData) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: data.name,
    description: data.description,
    url: abs(data.url),
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "State", name: "Espírito Santo", addressCountry: "BR" },
    inLanguage: "pt-BR",
  };
}

export function buildWebPage(data: WebPageData) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": abs(data.url),
    name: data.name,
    description: data.description,
    url: abs(data.url),
    inLanguage: "pt-BR",
    publisher: { "@id": ORG_ID },
  };
}

export function buildWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: "Comercial JR LTDA",
    inLanguage: "pt-BR",
    publisher: { "@id": ORG_ID },
  };
}

export function buildLocalBusiness(descriptionOverride?: string) {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": ORG_ID,
    name: "Comercial JR LTDA",
    alternateName: "Comercial JR",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.webp`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/og-image.jpg`,
    description:
      descriptionOverride ||
      "Referência em máquinas elétricas, ferramentas, irrigação, bombas e motores no Espírito Santo. Revenda autorizada STIHL. Mais de 18.000 produtos, 41 anos de tradição.",
    foundingDate: "1985",
    slogan: "Sua casa de máquinas, ferramentas e irrigação.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. Nossa Senhora da Penha, 1320",
      addressLocality: "Castelo",
      addressRegion: "ES",
      postalCode: "29360-000",
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -20.6044,
      longitude: -41.1939,
    },
    telephone: "+552835421332",
    email: "contato@comercialjrltda.com.br",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "07:00",
        closes: "17:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "07:00",
        closes: "11:30",
      },
    ],
    sameAs: [
      "https://www.facebook.com/ComercialJRCastelo",
      "https://www.instagram.com/comercialjrltda",
      "https://www.youtube.com/@comercialjrltda",
      "https://www.linkedin.com/company/comercial-jr/",
      "https://www.tiktok.com/@lojacomercialjr",
    ],
    hasMap: "https://maps.app.goo.gl/CZqaLr24pM5C4HvQ8",
    priceRange: "$$",
    areaServed: { "@type": "State", name: "Espírito Santo" },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+552835421332",
      contactType: "customer service",
      availableLanguage: "Portuguese",
    },
  };
}

export function buildArticle(data: ArticleData) {
  const url = abs(data.url);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.headline,
    description: data.description,
    ...(data.image ? { image: abs(data.image) } : {}),
    datePublished: data.datePublished,
    ...(data.dateModified ? { dateModified: data.dateModified } : {}),
    author: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: data.author || "Comercial JR",
    },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    inLanguage: "pt-BR",
  };
}

export function buildFAQPage(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
