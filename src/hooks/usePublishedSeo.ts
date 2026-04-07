/**
 * usePublishedSeo.ts
 * Hook público read-only para configurações globais de SEO.
 * Busca de /data/seo-settings.json — sem localStorage.
 * Usado por SEOHead.tsx e Footer.tsx no lugar de leitura direta do localStorage.
 */

import { useState, useEffect } from "react";
import { defaultSeoSettings, type SeoSettings } from "@/hooks/useSeoSettings";

const SEO_JSON_PATH = "/data/seo-settings.json";

/**
 * Mapeia o formato do JSON publicado (AdminSeoEditor/GlobalSeo)
 * para o formato SeoSettings usado pelo público.
 */
function mapPublishedToSettings(data: Record<string, unknown>): Partial<SeoSettings> {
  const mapped: Partial<SeoSettings> = {};

  if (typeof data.homeTitle === "string") mapped.homeTitle = data.homeTitle;
  if (typeof data.homeDescription === "string") mapped.homeDescription = data.homeDescription;
  if (typeof data.companyName === "string") mapped.companyName = data.companyName;
  if (typeof data.defaultImage === "string") mapped.ogImage = data.defaultImage;
  if (typeof data.googleVerification === "string") mapped.googleSiteVerification = data.googleVerification;
  if (typeof data.defaultRobots === "string") mapped.robotsDefault = data.defaultRobots;
  if (typeof data.nofollowExternal === "boolean") mapped.externalLinksNofollow = data.nofollowExternal;
  if (typeof data.nofollowInternal === "boolean") mapped.internalLinksFollow = !data.nofollowInternal;
  if (typeof data.ogLocale === "string") mapped.ogLocale = data.ogLocale;
  if (typeof data.referrerPolicy === "string") mapped.referrerPolicy = data.referrerPolicy;
  if (typeof data.themeColor === "string") mapped.themeColor = data.themeColor;

  return mapped;
}

// Cache em memória — evita re-fetch a cada navegação SPA
let moduleCache: SeoSettings | null = null;

export function usePublishedSeo(): SeoSettings {
  const [settings, setSettings] = useState<SeoSettings>(
    () => moduleCache ?? defaultSeoSettings,
  );

  useEffect(() => {
    if (moduleCache) return;

    let cancelled = false;

    fetch(SEO_JSON_PATH, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, unknown>>) : null))
      .then((data) => {
        if (cancelled || !data || typeof data !== "object") return;
        const resolved = { ...defaultSeoSettings, ...data, ...mapPublishedToSettings(data) };
        moduleCache = resolved;
        setSettings(resolved);
      })
      .catch(() => { /* fallback: mantém defaults */ });

    return () => { cancelled = true; };
  }, []);

  return settings;
}
