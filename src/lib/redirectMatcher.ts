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
        // Garantir barra inicial no padrão regex para match consistente
        const source = rule.sourceUrl.startsWith("/") ? rule.sourceUrl : `/${rule.sourceUrl}`;
        const regex = new RegExp(`^${source}$`, "i");
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
    const source = rule.sourceUrl.startsWith("/") ? rule.sourceUrl : `/${rule.sourceUrl}`;
    const regex = new RegExp(`^${source}$`, "i");
    return normalizePath(pathname).replace(regex, rule.targetUrl);
  } catch {
    return rule.targetUrl;
  }
};

/** Normaliza path garantindo barra inicial, removendo trailing slash e convertendo para lowercase */
const normalizePath = (path: string): string => {
  let p = path.startsWith("/") ? path : `/${path}`;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p.toLowerCase();
};
