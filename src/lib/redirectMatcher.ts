import type { RedirectRule } from "@/data/redirectTypes";

/**
 * Encontra a primeira regra de redirect ativa que corresponde ao pathname.
 * Regras são testadas na ordem do array (primeira correspondência vence).
 */
export const findMatchingRule = (
  pathname: string,
  rules: RedirectRule[]
): RedirectRule | null => {
  const normalizedPath = normalizePath(pathname);

  for (const rule of rules) {
    if (!rule.enabled) continue;

    if (rule.isRegex) {
      try {
        const regex = new RegExp(`^${rule.sourceUrl}$`, "i");
        if (regex.test(normalizedPath)) return rule;
      } catch {
        // Regex inválido — ignora silenciosamente
      }
    } else {
      const normalizedSource = normalizePath(rule.sourceUrl);
      if (normalizedSource === normalizedPath) return rule;
    }
  }

  return null;
};

/**
 * Para regras regex, resolve o targetUrl substituindo grupos de captura.
 * Ex: sourceUrl = "/blog/(.*)", targetUrl = "/artigos/$1"
 */
export const resolveTargetUrl = (
  pathname: string,
  rule: RedirectRule
): string => {
  if (!rule.isRegex || rule.type === 410) return rule.targetUrl;

  try {
    const regex = new RegExp(`^${rule.sourceUrl}$`, "i");
    return normalizePath(pathname).replace(regex, rule.targetUrl);
  } catch {
    return rule.targetUrl;
  }
};

/** Normaliza path removendo trailing slash (exceto root) e convertendo para lowercase */
const normalizePath = (path: string): string => {
  const trimmed = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  return trimmed.toLowerCase();
};
