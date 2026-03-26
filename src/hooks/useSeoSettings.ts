// Hook centralizado para configurações globais de SEO
// Lê e salva no localStorage; consumido por SEOHead e AdminSeoEditor

export const SEO_STORAGE_KEY = "comercial-jr-global-seo-v2";

export interface SeoSettings {
  // Básico
  homeTitle: string;
  homeDescription: string;
  companyName: string;
  siteUrl: string;

  // Indexação
  robotsDefault: string; // e.g. "index,follow"
  googleSiteVerification: string;
  canonicalBase: string; // e.g. "https://comercialjrltda.com.br"

  // Privacidade / referrer
  referrerPolicy: string; // e.g. "no-referrer-when-downgrade"

  // Open Graph
  ogImage: string;
  ogLocale: string; // e.g. "pt_BR"
  ogSiteName: string;

  // Twitter / X
  twitterCard: string; // "summary_large_image"
  twitterSite: string; // "@handle"

  // PWA / mobile
  themeColor: string; // e.g. "#ffffff"

  // Rel de links
  // true = links externos recebem rel="nofollow" por padrão
  externalLinksNofollow: boolean;
  // true = links internos recebem rel="follow" explícito
  internalLinksFollow: boolean;
  // O subdomínio da loja NUNCA recebe nofollow
  storeSubdomain: string; // e.g. "loja.comercialjrltda.com.br"
}

export const defaultSeoSettings: SeoSettings = {
  homeTitle: "Comercial JR LTDA - Máquinas, Ferramentas e Irrigação em Castelo ES",
  homeDescription:
    "Referência em máquinas elétricas, ferramentas, irrigação, bombas e motores no Espírito Santo. Revenda autorizada STIHL. Mais de 18.000 produtos, 41 anos de tradição.",
  companyName: "Comercial JR LTDA",
  siteUrl: "https://comercialjrltda.com.br",

  robotsDefault: "index,follow",
  googleSiteVerification: "",
  canonicalBase: "https://comercialjrltda.com.br",

  referrerPolicy: "no-referrer-when-downgrade",

  ogImage: "/og-image.jpg",
  ogLocale: "pt_BR",
  ogSiteName: "Comercial JR LTDA",

  twitterCard: "summary_large_image",
  twitterSite: "",

  themeColor: "#ffffff",

  externalLinksNofollow: true,
  internalLinksFollow: true,
  storeSubdomain: "loja.comercialjrltda.com.br",
};

export function loadSeoSettings(): SeoSettings {
  try {
    const stored = localStorage.getItem(SEO_STORAGE_KEY);
    if (!stored) return { ...defaultSeoSettings };
    return { ...defaultSeoSettings, ...JSON.parse(stored) };
  } catch {
    return { ...defaultSeoSettings };
  }
}

export function saveSeoSettings(settings: SeoSettings): void {
  localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(settings));
}

/** Retorna o rel correto para um link dado o href e a configuração atual */
export function resolveLinkRel(
  href: string,
  isExternal: boolean,
  settings: SeoSettings,
  overrideRel?: string
): string | undefined {
  if (overrideRel !== undefined) return overrideRel || undefined;

  // Loja: nunca nofollow
  if (href.includes(settings.storeSubdomain)) return undefined;

  if (isExternal && settings.externalLinksNofollow) return "nofollow";

  return undefined;
}
