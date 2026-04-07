/**
 * usePublishedRedirects.ts
 * Hook público read-only para regras de redirect.
 * Busca dados de /data/redirects.json — sem zustand, sem persist, sem localStorage.
 * Usado por RedirectGuard.tsx no lugar de useRedirectStore.
 */

import { useState, useEffect, useCallback } from "react";
import type { RedirectRule } from "@/data/redirectTypes";
import { fetchPublishedRedirects } from "@/lib/redirectContent";
import { findMatchingRule } from "@/lib/redirectMatcher";

interface PublishedRedirectsState {
  rules: RedirectRule[];
  loading: boolean;
  initialized: boolean;
}

// Cache em memória — evita re-fetch a cada navegação SPA
let moduleCache: RedirectRule[] | null = null;

export function usePublishedRedirects(): PublishedRedirectsState & {
  findMatch: (pathname: string) => RedirectRule | null;
} {
  const [state, setState] = useState<PublishedRedirectsState>(() =>
    moduleCache
      ? { rules: moduleCache, loading: false, initialized: true }
      : { rules: [], loading: true, initialized: false },
  );

  useEffect(() => {
    if (moduleCache) return;

    let cancelled = false;

    fetchPublishedRedirects()
      .then((data) => {
        if (cancelled) return;
        moduleCache = data.rules;
        setState({ rules: data.rules, loading: false, initialized: true });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ rules: [], loading: false, initialized: true });
      });

    return () => { cancelled = true; };
  }, []);

  const findMatch = useCallback(
    (pathname: string) => findMatchingRule(pathname, state.rules.filter((r) => r.enabled)),
    [state.rules],
  );

  return { ...state, findMatch };
}
