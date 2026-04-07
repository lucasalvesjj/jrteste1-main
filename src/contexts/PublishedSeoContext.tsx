/**
 * PublishedSeoContext.tsx
 * Context React que disponibiliza as configurações SEO publicadas
 * para todos os componentes públicos (SEOHead, Footer, etc.)
 * sem depender de localStorage.
 */

import { createContext, useContext, type ReactNode } from "react";
import { usePublishedSeo } from "@/hooks/usePublishedSeo";
import { defaultSeoSettings, type SeoSettings } from "@/hooks/useSeoSettings";

const PublishedSeoContext = createContext<SeoSettings>(defaultSeoSettings);

export function PublishedSeoProvider({ children }: { children: ReactNode }) {
  const settings = usePublishedSeo();
  return (
    <PublishedSeoContext.Provider value={settings}>
      {children}
    </PublishedSeoContext.Provider>
  );
}

export function usePublishedSeoContext(): SeoSettings {
  return useContext(PublishedSeoContext);
}
