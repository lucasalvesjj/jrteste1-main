export type RedirectType = 301 | 302 | 307 | 410;

export interface RedirectRule {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  type: RedirectType;
  isRegex: boolean;
  group: string;
  enabled: boolean;
  hits: number;
  lastHitAt: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotFoundLogEntry {
  id: string;
  url: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
  count: number;
  resolved: boolean;
  resolvedWithRuleId?: string;
}

export interface RedirectExportFile {
  version: number;
  exportedAt: string;
  rules: RedirectRule[];
  notFoundLog: NotFoundLogEntry[];
  groups: string[];
}

export const REDIRECT_TYPES: { value: RedirectType; label: string; description: string }[] = [
  { value: 301, label: "301 — Permanente", description: "Redirecionamento permanente. Mecanismos de busca transferem autoridade." },
  { value: 302, label: "302 — Temporário", description: "Redirecionamento temporário. URL original mantém autoridade." },
  { value: 307, label: "307 — Temporário (strict)", description: "Redirecionamento temporário que preserva o método HTTP." },
  { value: 410, label: "410 — Gone", description: "Conteúdo removido permanentemente. Mecanismos de busca desindexam mais rápido." },
];
