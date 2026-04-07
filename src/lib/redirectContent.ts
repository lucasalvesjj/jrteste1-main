import type { RedirectRule, NotFoundLogEntry, RedirectExportFile } from "@/data/redirectTypes";

export const REDIRECT_DATA_PATH = "/data/redirects.json";
export const REDIRECT_EXPORT_VERSION = 1;

const isRedirectRule = (value: unknown): value is RedirectRule => {
  if (!value || typeof value !== "object") return false;
  const rule = value as Record<string, unknown>;
  return (
    typeof rule.id === "string" &&
    typeof rule.sourceUrl === "string" &&
    typeof rule.targetUrl === "string" &&
    (rule.type === 301 || rule.type === 302 || rule.type === 307 || rule.type === 410) &&
    typeof rule.enabled === "boolean"
  );
};

const isNotFoundLogEntry = (value: unknown): value is NotFoundLogEntry => {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string" && typeof entry.url === "string" && typeof entry.count === "number";
};

const normalizeRule = (rule: RedirectRule): RedirectRule => ({
  id: rule.id,
  sourceUrl: rule.sourceUrl,
  targetUrl: rule.targetUrl ?? "",
  type: rule.type,
  isRegex: Boolean(rule.isRegex),
  group: rule.group ?? "",
  enabled: Boolean(rule.enabled),
  hits: Number(rule.hits) || 0,
  lastHitAt: rule.lastHitAt ?? null,
  note: rule.note ?? "",
  createdAt: rule.createdAt ?? new Date().toISOString(),
  updatedAt: rule.updatedAt ?? new Date().toISOString(),
});

export const createRedirectExportFile = (
  rules: RedirectRule[],
  notFoundLog: NotFoundLogEntry[],
  groups: string[]
): RedirectExportFile => ({
  version: REDIRECT_EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  rules: rules.map(normalizeRule),
  notFoundLog,
  groups,
});

export interface ParsedRedirectImport {
  rules: RedirectRule[];
  notFoundLog: NotFoundLogEntry[];
  groups: string[];
}

export const parseRedirectImport = (raw: string): ParsedRedirectImport => {
  const parsed = JSON.parse(raw) as unknown;

  if (!parsed || typeof parsed !== "object" || !("rules" in parsed)) {
    throw new Error("invalid-json-shape");
  }

  const data = parsed as { rules?: unknown[]; notFoundLog?: unknown[]; groups?: unknown[] };

  if (!Array.isArray(data.rules) || !data.rules.every(isRedirectRule)) {
    throw new Error("invalid-rules-array");
  }

  const notFoundLog =
    Array.isArray(data.notFoundLog) && data.notFoundLog.every(isNotFoundLogEntry)
      ? data.notFoundLog
      : [];

  const groups =
    Array.isArray(data.groups) && data.groups.every((g) => typeof g === "string")
      ? data.groups
      : [];

  return {
    rules: data.rules.map(normalizeRule),
    notFoundLog,
    groups,
  };
};

export const fetchPublishedRedirects = async (): Promise<ParsedRedirectImport> => {
  const response = await fetch(REDIRECT_DATA_PATH, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`http-${response.status}`);
  }

  const text = await response.text();
  return parseRedirectImport(text);
};
