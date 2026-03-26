import { useCallback, useRef, useState } from "react";
import { ArrowLeft, Check, Save } from "lucide-react";
import { toast } from "sonner";

// ── Tracking Code ─────────────────────────────────────────────────────────

export type TrackingPosition = "head" | "body_start" | "body_end";
export type TrackingScope    = "global" | "specific";

export interface TrackingCode {
  id: string;
  name: string;
  code: string;
  position: TrackingPosition;
  scope: TrackingScope;
  includedPaths: string[];
  excludedPaths: string[];
  enabled: boolean;
  order: number;
}

export const TRACKING_STORAGE_KEY = "comercial-jr-tracking-codes";

export function getTrackingCodes(): TrackingCode[] {
  try {
    const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveTrackingCodes(codes: TrackingCode[]): void {
  localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(codes));
}

function newTrackingCode(existingCount: number): TrackingCode {
  return {
    id: `tc-${Date.now()}`, name: "", code: "",
    position: "head", scope: "global",
    includedPaths: [], excludedPaths: [],
    enabled: true, order: existingCount,
  };
}

// ── GlobalSeo — tipos e storage ───────────────────────────────────────────
export const SEO_STORAGE_KEY = "comercial-jr-global-seo";

type SeoKeys = keyof GlobalSeo;

interface GlobalSeo {
  homeTitle: string; homeDescription: string; companyName: string; defaultImage: string;
  googleVerification: string;
  defaultRobots: string; nofollowExternal: boolean; nofollowInternal: boolean;
  ogLocale: string;
  referrerPolicy: string;
  themeColor: string;
  dnsPrefetch: string; preconnect: string;
}

const SEO_DEFAULTS: GlobalSeo = {
  homeTitle: "Comercial JR LTDA - Máquinas, Ferramentas e Irrigação",
  homeDescription: "Referência em máquinas, ferramentas e irrigação no Espírito Santo. Mais de 18.000 produtos e 41 anos de tradição.",
  companyName: "Comercial JR LTDA",
  defaultImage: "/og-image.jpg",
  googleVerification: "da794cd9937527d01",
  defaultRobots: "index,follow",
  nofollowExternal: true, nofollowInternal: false,
  ogLocale: "pt_BR",
  referrerPolicy: "no-referrer-when-downgrade",
  themeColor: "#1a3c6e",
  dnsPrefetch: "//fonts.googleapis.com, //fonts.gstatic.com",
  preconnect: "https://fonts.googleapis.com, https://fonts.gstatic.com",
};

function loadSeo(): GlobalSeo {
  try {
    const raw = localStorage.getItem(SEO_STORAGE_KEY);
    if (!raw) return { ...SEO_DEFAULTS };
    return { ...SEO_DEFAULTS, ...JSON.parse(raw) };
  } catch { return { ...SEO_DEFAULTS }; }
}

/** Salva APENAS as chaves fornecidas, preservando o resto do localStorage */
function saveSeoKeys(keys: SeoKeys[], values: Partial<GlobalSeo>): void {
  const current = loadSeo();
  const next = { ...current };
  for (const k of keys) {
    if (k in values) (next as Record<string, unknown>)[k] = values[k];
  }
  localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(next));
}

// ── useSeoSection — hook de estado por seção ─────────────────────────────
/**
 * Cada seção gerencia seu próprio estado.
 * - `dirty`: true quando o valor local difere do salvo
 * - `save()`: persiste somente as chaves desta seção
 */
function useSeoSection<T extends Partial<GlobalSeo>>(keys: SeoKeys[], initial: T) {
  const saved    = useRef<T>(initial);
  const [local, setLocal] = useState<T>(initial);

  const dirty = JSON.stringify(local) !== JSON.stringify(saved.current);

  const set = useCallback((patch: Partial<T>) =>
    setLocal((prev) => ({ ...prev, ...patch })), []);

  const save = useCallback(() => {
    saveSeoKeys(keys, local);
    saved.current = local;
    // força re-render para limpar dirty
    setLocal((prev) => ({ ...prev }));
    toast.success("Seção salva");
  }, [keys, local]);

  const discard = useCallback(() => {
    setLocal(saved.current);
  }, []);

  return { local, set, dirty, save, discard };
}

// ── Estilos comuns ────────────────────────────────────────────────────────
const inputCls  = "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";
const selectCls = "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";
const cardCls   = "rounded-xl border bg-card p-6 space-y-4 transition-colors";

// ── SectionSaveButton ─────────────────────────────────────────────────────
interface SectionSaveProps {
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

function SectionSaveButton({ dirty, onSave, onDiscard }: SectionSaveProps) {
  if (!dirty) return null;
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-2">
      <span className="flex-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
        ● Alterações não salvas
      </span>
      <button
        onClick={onDiscard}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
      >
        Descartar
      </button>
      <button
        onClick={onSave}
        className="flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-1.5 text-xs font-semibold text-secondary-foreground transition-opacity hover:opacity-90"
      >
        <Save className="h-3.5 w-3.5" /> Salvar seção
      </button>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────
const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

// ── SectionHeader ─────────────────────────────────────────────────────────
function SectionHeader({ title, dirty }: { title: string; dirty: boolean }) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2 mb-4">
      <h2 className="flex-1 font-heading text-base font-bold text-foreground">{title}</h2>
      {dirty && (
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          não salvo
        </span>
      )}
    </div>
  );
}

// ── Opções de select ──────────────────────────────────────────────────────
const ROBOTS_OPTIONS = [
  { value: "index,follow",     label: "index, follow (padrão — indexar e seguir links)" },
  { value: "noindex,follow",   label: "noindex, follow (não indexar, seguir links)" },
  { value: "index,nofollow",   label: "index, nofollow (indexar, não seguir links)" },
  { value: "noindex,nofollow", label: "noindex, nofollow (não indexar, não seguir)" },
];
const REFERRER_OPTIONS = [
  { value: "no-referrer-when-downgrade", label: "no-referrer-when-downgrade (padrão)" },
  { value: "no-referrer",               label: "no-referrer (máxima privacidade)" },
  { value: "origin",                    label: "origin (só envia domínio)" },
  { value: "strict-origin",             label: "strict-origin" },
  { value: "unsafe-url",                label: "unsafe-url (envia URL completa — não recomendado)" },
];
const LOCALE_OPTIONS = [
  { value: "pt_BR", label: "pt_BR — Português (Brasil)" },
  { value: "pt_PT", label: "pt_PT — Português (Portugal)" },
  { value: "en_US", label: "en_US — English (US)" },
];

// ── Componente principal ──────────────────────────────────────────────────
const AdminSeoEditor = ({ onBack }: { onBack: () => void }) => {
  const seo = loadSeo();

  // ── Seção 1 — Identidade ──
  const identity = useSeoSection(
    ["homeTitle", "homeDescription", "companyName", "defaultImage"],
    { homeTitle: seo.homeTitle, homeDescription: seo.homeDescription, companyName: seo.companyName, defaultImage: seo.defaultImage }
  );

  // ── Seção 2 — Google Search Console ──
  const gsc = useSeoSection(
    ["googleVerification"],
    { googleVerification: seo.googleVerification }
  );

  // ── Seção 4 — Indexação / robots ──
  const robots = useSeoSection(
    ["defaultRobots", "nofollowExternal", "nofollowInternal"],
    { defaultRobots: seo.defaultRobots, nofollowExternal: seo.nofollowExternal, nofollowInternal: seo.nofollowInternal }
  );

  // ── Seção 5 — Open Graph / Locale ──
  const og = useSeoSection(["ogLocale"], { ogLocale: seo.ogLocale });

  // ── Seção 6 — Referrer ──
  const referrer = useSeoSection(["referrerPolicy"], { referrerPolicy: seo.referrerPolicy });

  // ── Seção 7 — PWA / theme-color ──
  const pwa = useSeoSection(["themeColor"], { themeColor: seo.themeColor });

  // ── Seção 8 — Performance ──
  const perf = useSeoSection(
    ["dnsPrefetch", "preconnect"],
    { dnsPrefetch: seo.dnsPrefetch, preconnect: seo.preconnect }
  );

  const anyDirty = identity.dirty || gsc.dirty || robots.dirty || og.dirty || referrer.dirty || pwa.dirty || perf.dirty;

  return (
    <div className="dark admin-dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="container-custom flex h-14 items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <h1 className="font-heading text-sm font-bold flex-1">SEO Global</h1>
          {anyDirty ? (
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
              Há seções não salvas
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
              <Check className="h-3 w-3" /> Tudo salvo
            </span>
          )}
        </div>
      </header>

      <div className="container-custom mx-auto max-w-2xl space-y-6 py-6">

        {/* ── Preview Google — acima de tudo ── */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview do Link (Homepage)</p>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-stretch">
              {/* Thumbnail à esquerda */}
              <div className="flex w-32 flex-shrink-0 items-center justify-center bg-muted">
                {(() => {
                  const src = identity.local.defaultImage || "/favicon.webp";
                  const absolute = src.startsWith("http") ? src : `${window.location.origin}${src}`;
                  return (
                    <img
                      src={absolute}
                      alt="OG Image"
                      className="h-full w-full object-cover"
                      style={{ maxHeight: 96 }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (!img.src.includes("favicon.webp")) {
                          img.src = `${window.location.origin}/favicon.webp`;
                        }
                      }}
                    />
                  );
                })()}
              </div>
              {/* Texto à direita */}
              <div className="flex min-w-0 flex-col justify-center gap-0.5 bg-muted/30 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">comercialjrltda.com.br</p>
                <p className="line-clamp-2 text-sm font-semibold text-foreground leading-snug">
                  {identity.local.homeTitle || "—"}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {identity.local.homeDescription || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 1. Identidade ── */}
        <div className={`${cardCls} ${identity.dirty ? "border-amber-500/40" : "border-border"}`}>
          <SectionHeader title="Identidade do Site" dirty={identity.dirty} />
          <Field label="Título da Homepage" hint={`${identity.local.homeTitle.length}/70 caracteres — keyword no início, ~50-70 chars`}>
            <input type="text" value={identity.local.homeTitle} onChange={(e) => identity.set({ homeTitle: e.target.value })} className={inputCls} maxLength={70} />
          </Field>
          <Field label="Descrição Padrão (meta description)" hint={`${identity.local.homeDescription.length}/160 caracteres`}>
            <textarea value={identity.local.homeDescription} onChange={(e) => identity.set({ homeDescription: e.target.value })} rows={3} className={`${inputCls} resize-none`} maxLength={160} />
          </Field>
          <Field label="Nome da Empresa">
            <input type="text" value={identity.local.companyName} onChange={(e) => identity.set({ companyName: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Imagem OG Padrão (og:image)" hint="Caminho relativo ou URL absoluta. Ideal: 1200×630px">
            <input type="text" value={identity.local.defaultImage} onChange={(e) => identity.set({ defaultImage: e.target.value })} className={inputCls} placeholder="/og-image.jpg" />
          </Field>
          <SectionSaveButton dirty={identity.dirty} onSave={identity.save} onDiscard={identity.discard} />
        </div>

        {/* ── 2. Google Search Console ── */}
        <div className={`${cardCls} ${gsc.dirty ? "border-amber-500/40" : "border-border"}`}>
          <SectionHeader title="Google Search Console" dirty={gsc.dirty} />
          <Field label="Código de Verificação (google-site-verification)" hint="Apenas o valor do content=, sem aspas. Ex: da794cd9937527d01">
            <input type="text" value={gsc.local.googleVerification} onChange={(e) => gsc.set({ googleVerification: e.target.value })} className={inputCls} placeholder="da794cd9937527d01" />
          </Field>
          <div className="rounded-lg bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
            Tag gerada: <code className="font-mono text-foreground">{`<meta name="google-site-verification" content="${gsc.local.googleVerification || "..."}">`}</code>
            <br />Inserida automaticamente apenas na página inicial.
          </div>
          <SectionSaveButton dirty={gsc.dirty} onSave={gsc.save} onDiscard={gsc.discard} />
        </div>

        {/* ── 4. Indexação / Robots ── */}
        <div className={`${cardCls} ${robots.dirty ? "border-amber-500/40" : "border-border"}`}>
          <SectionHeader title="Indexação Padrão (robots)" dirty={robots.dirty} />
          <Field label="Diretiva robots padrão" hint="Cada post e página pode sobrescrever individualmente">
            <select value={robots.local.defaultRobots} onChange={(e) => robots.set({ defaultRobots: e.target.value })} className={selectCls}>
              {ROBOTS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <div className="flex flex-col gap-3 pt-1">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={robots.local.nofollowExternal} onChange={(e) => robots.set({ nofollowExternal: e.target.checked })} className="h-4 w-4 rounded border-input" />
              Links externos com <code className="font-mono text-xs bg-muted px-1 rounded">rel="nofollow"</code> por padrão
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={robots.local.nofollowInternal} onChange={(e) => robots.set({ nofollowInternal: e.target.checked })} className="h-4 w-4 rounded border-input" />
              Links internos com <code className="font-mono text-xs bg-muted px-1 rounded">rel="nofollow"</code> por padrão
            </label>
            <p className="text-xs text-muted-foreground">Links para a loja usam <code className="font-mono">rel="noopener noreferrer"</code> — configure lá separadamente.</p>
          </div>
          <SectionSaveButton dirty={robots.dirty} onSave={robots.save} onDiscard={robots.discard} />
        </div>

        {/* ── 5. Open Graph / Locale ── */}
        <div className={`${cardCls} ${og.dirty ? "border-amber-500/40" : "border-border"}`}>
          <SectionHeader title="Open Graph e Locale" dirty={og.dirty} />
          <Field label="og:locale" hint="Idioma/região do conteúdo para Facebook e compartilhamentos">
            <select value={og.local.ogLocale} onChange={(e) => og.set({ ogLocale: e.target.value })} className={selectCls}>
              {LOCALE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <SectionSaveButton dirty={og.dirty} onSave={og.save} onDiscard={og.discard} />
        </div>

        {/* ── 6. Privacidade / Referrer ── */}
        <div className={`${cardCls} ${referrer.dirty ? "border-amber-500/40" : "border-border"}`}>
          <SectionHeader title="Privacidade (Referrer Policy)" dirty={referrer.dirty} />
          <Field label="Política de Referrer" hint="Controla quais dados de URL são enviados ao navegar para outros sites">
            <select value={referrer.local.referrerPolicy} onChange={(e) => referrer.set({ referrerPolicy: e.target.value })} className={selectCls}>
              {REFERRER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <SectionSaveButton dirty={referrer.dirty} onSave={referrer.save} onDiscard={referrer.discard} />
        </div>

        {/* ── 7. PWA / Mobile ── */}
        <div className={`${cardCls} ${pwa.dirty ? "border-amber-500/40" : "border-border"}`}>
          <SectionHeader title="PWA / Mobile (theme-color)" dirty={pwa.dirty} />
          <Field label="Cor do tema" hint="Cor da barra do navegador em dispositivos móveis e PWA">
            <div className="flex items-center gap-3">
              <input type="color" value={pwa.local.themeColor} onChange={(e) => pwa.set({ themeColor: e.target.value })} className="h-10 w-16 cursor-pointer rounded border border-input bg-background" />
              <input type="text" value={pwa.local.themeColor} onChange={(e) => pwa.set({ themeColor: e.target.value })} className={`${inputCls} flex-1`} placeholder="#1a3c6e" />
            </div>
          </Field>
          <SectionSaveButton dirty={pwa.dirty} onSave={pwa.save} onDiscard={pwa.discard} />
        </div>

        {/* ── 8. Performance ── */}
        <div className={`${cardCls} ${perf.dirty ? "border-amber-500/40" : "border-border"}`}>
          <SectionHeader title="Performance (Prefetch / Preconnect)" dirty={perf.dirty} />
          <Field label="DNS Prefetch (separar por vírgula)" hint="Ex: //fonts.googleapis.com, //cdnjs.cloudflare.com">
            <textarea value={perf.local.dnsPrefetch} onChange={(e) => perf.set({ dnsPrefetch: e.target.value })} rows={2} className={`${inputCls} resize-none font-mono text-xs`} />
          </Field>
          <Field label="Preconnect (separar por vírgula)" hint="URLs completas. Ex: https://fonts.googleapis.com">
            <textarea value={perf.local.preconnect} onChange={(e) => perf.set({ preconnect: e.target.value })} rows={2} className={`${inputCls} resize-none font-mono text-xs`} />
          </Field>
          <SectionSaveButton dirty={perf.dirty} onSave={perf.save} onDiscard={perf.discard} />
        </div>

        <div className="pb-8" />
      </div>
    </div>
  );
};

export default AdminSeoEditor;
