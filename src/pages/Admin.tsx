import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  FolderPlus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  LogOut,
  FileText,
  CheckCircle,
  Clock,
  RefreshCw,
  Server,
  Laptop,
  Copy,
  Check,
  HardDriveUpload,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  SlidersHorizontal,
  Tags,
  X,
  BookOpen,
  Terminal,
  Github,
  Send,
  KeyRound,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import {
  loadGitHubConfig,
  saveGitHubConfig,
  clearGitHubConfig,
  publishToGitHub,
  DEFAULT_FILE_PATH,
  DEFAULT_BRANCH,
  type GitHubPublishConfig,
} from "@/lib/githubPublish";
import { toast } from "sonner";
import { useBlogStore } from "@/stores/blogStore";
import type { BlogPost, BlogCategory } from "@/data/blogTypes";
import { BLOG_DATA_PATH, parseBlogImport } from "@/lib/blogContent";
import { getCategoryLabel, getCategoryTone, getPostCategories } from "@/lib/blogCategories";
import JRLoader from "@/components/JRLoader";
import {
  getTrackingCodes,
  saveTrackingCodes,
  type TrackingCode,
  type TrackingPosition,
  type TrackingScope,
} from "@/components/admin/AdminSeoEditor";

const AdminPostEditor = lazy(() => import("@/components/admin/AdminPostEditor"));
const AdminSeoEditor = lazy(() => import("@/components/admin/AdminSeoEditor"));

const ADMIN_PASS = "0";
const ADMIN_AUTH_KEY = "comercial-jr-admin-authenticated";
const POSTS_PAGE_SIZE = 20;

type SortField = "date" | "status" | "title" | "category";
type SortDirection = "asc" | "desc";

const sourceMeta = {
  "published-json": {
    label: "Lendo arquivo publicado do servidor",
    tone: "bg-brand-green/10 text-brand-green",
    icon: Server,
  },
  "fallback-code": {
    label: "Arquivo publicado não encontrado",
    tone: "bg-primary/10 text-primary",
    icon: FileText,
  },
  "local-draft": {
    label: "Cópia local em edição",
    tone: "bg-brand-orange/10 text-brand-orange",
    icon: Laptop,
  },
} as const;

const formatExportDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}_${hours}-${minutes}`;
};

const buildDuplicateSlug = (slug: string, existingSlugs: string[]) => {
  let counter = 1;
  let candidate = `${slug}-${counter}`;

  while (existingSlugs.includes(candidate)) {
    counter += 1;
    candidate = `${slug}-${counter}`;
  }

  return candidate;
};

const buildDuplicateTitle = (title: string, existingTitles: string[]) => {
  let counter = 1;
  let candidate = `${title} -${counter}`;

  while (existingTitles.includes(candidate)) {
    counter += 1;
    candidate = `${title} -${counter}`;
  }

  return candidate;
};

const AdminViewFallback = ({ label }: { label: string }) => (
  <JRLoader size="lg" label={`Carregando ${label}...`} />
);

// ── Modal de Categorias ───────────────────────────────────────────────────────
interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: BlogCategory[];
  onAdd: (label: string) => void;
  onToggleVisibility: (id: string) => void;
}

function CategoryModal({ isOpen, onClose, categories, onAdd, onToggleVisibility }: CategoryModalProps) {
  const [newLabel, setNewLabel] = useState("");

  const handleAdd = () => {
    if (!newLabel.trim()) { toast.error("Digite um nome para criar a categoria"); return; }
    onAdd(newLabel.trim());
    setNewLabel("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">Categorias do Blog</h2>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {categories.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Crie e gerencie categorias do blog. Elas passam a valer no admin, no blog e no JSON exportado.
          </p>

          {/* Criar nova */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
              placeholder="Ex: Jardinagem, Construção Civil..."
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Criar
            </button>
          </div>

          {/* Lista de categorias */}
          {categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              Nenhuma categoria criada ainda.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center gap-1.5 rounded-full pl-3 pr-1.5 py-1.5 text-sm font-medium transition-opacity ${
                    getCategoryTone(cat.id, categories)
                  } ${cat.hidden ? "opacity-45" : ""}`}
                >
                  <span>{cat.label}</span>
                  <span className="text-xs opacity-60">/{cat.id}</span>
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(cat.id)}
                    title={cat.hidden ? "Oculta — clique para tornar visível" : "Visível — clique para ocultar"}
                    className="ml-1 rounded-full p-1 transition-colors hover:bg-black/10"
                  >
                    {cat.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de Publicação ───────────────────────────────────────────────────────
interface PublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: keyof typeof sourceMeta;
  exportName: string;
  blogDataPath: string;
  copiedItem: "path" | "filename" | null;
  loading: boolean;
  onCopyText: (value: string, type: "path" | "filename") => void;
  onDownloadJson: (filename: string) => void;
  onResetToPublished: () => void;
}

function PublicationModal({
  isOpen, onClose, source, exportName, blogDataPath,
  copiedItem, loading, onCopyText, onDownloadJson, onResetToPublished,
}: PublicationModalProps) {
  if (!isOpen) return null;

  const current = sourceMeta[source];
  const SourceIcon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">Publicação</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">

          {/* Status da fonte */}
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${current.tone}`}>
            <SourceIcon className="h-4 w-4" />
            {current.label}
          </div>

          {/* Guia passo a passo */}
          <div>
            <h3 className="mb-3 font-heading text-sm font-bold text-foreground flex items-center gap-2">
              <HardDriveUpload className="h-4 w-4 text-primary" />
              Publicação Guiada
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "1. Edite ou revise os posts na sua cópia local.",
                "2. Clique em Exportar Publicação para baixar o arquivo oficial.",
                "3. Envie o arquivo para o servidor substituindo o JSON atual.",
                "4. Atualize o site ou limpe cache se necessário para ver a nova versão.",
              ].map((step) => (
                <div key={step} className="rounded-xl bg-muted/60 p-4 text-sm text-foreground">{step}</div>
              ))}
            </div>
          </div>

          {/* Resumo do arquivo */}
          <div>
            <h3 className="mb-3 font-heading text-sm font-bold text-foreground">Resumo do Arquivo</h3>
            <div className="space-y-2 text-sm">
              <div className="rounded-xl bg-muted/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Arquivo de publicação</div>
                <div className="mt-1 font-mono text-foreground">blog-posts.json</div>
              </div>
              <div className="rounded-xl bg-muted/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destino no servidor</div>
                <div className="mt-1 font-mono text-foreground">{blogDataPath}</div>
              </div>
              <div className="rounded-xl bg-muted/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Backup sugerido</div>
                <div className="mt-1 break-all font-mono text-foreground">{exportName}</div>
              </div>
              <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                O JSON exportado leva posts e categorias juntos. Publique sempre com o nome fixo{" "}
                <code className="mx-1 rounded bg-background px-1 py-0.5">blog-posts.json</code>.
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void onCopyText(blogDataPath, "path")}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {copiedItem === "path" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copiar Caminho do Servidor
            </button>
            <button
              onClick={() => { onDownloadJson(exportName); toast.success("Backup local exportado com data e hora"); }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Download className="h-4 w-4" />
              Exportar Backup com Data
            </button>
            <button
              onClick={() => void onCopyText(exportName, "filename")}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {copiedItem === "filename" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copiar Nome do Backup
            </button>
            <button
              onClick={() => { onResetToPublished(); }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Recarregar Publicado
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CodesModal — Tracking Codes popup standalone no Admin ────────────────────
const inputClsAdmin  = "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";
const selectClsAdmin = "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";

function newCode(count: number): TrackingCode {
  return { id: `tc-${Date.now()}`, name: "", code: "", position: "head", scope: "global", includedPaths: [], excludedPaths: [], enabled: true, order: count };
}

function CodesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tracking, setTracking] = useState<TrackingCode[]>(() => getTrackingCodes());
  const [savedStr, setSavedStr] = useState(() => JSON.stringify(getTrackingCodes()));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pathInputs, setPathInputs] = useState<Record<string, { inc: string; exc: string }>>({});

  const dirty = JSON.stringify(tracking) !== savedStr;
  const posLabel: Record<TrackingPosition, string> = { head: "<head>", body_start: "<body> início", body_end: "<body> fim" };

  const add    = () => { const c = newCode(tracking.length); setTracking((t) => [...t, c]); setExpanded(c.id); };
  const upd    = (id: string, patch: Partial<TrackingCode>) => setTracking((t) => t.map((c) => c.id === id ? { ...c, ...patch } : c));
  const rem    = (id: string) => { if (!window.confirm("Remover?")) return; setTracking((t) => t.filter((c) => c.id !== id)); };
  const mv     = (from: number, to: number) => setTracking((t) => { const n=[...t]; const [item]=n.splice(from,1); n.splice(to,0,item); return n.map((c,i)=>({...c,order:i})); });
  const addP   = (id: string, field: "includedPaths"|"excludedPaths", val: string) => { const v=val.trim(); if(!v) return; upd(id,{[field]:[...(tracking.find(c=>c.id===id)?.[field]??[]),v]}); setPathInputs(p=>({...p,[id]:{...p[id],[field==="includedPaths"?"inc":"exc"]:""}})); };
  const remP   = (id: string, field: "includedPaths"|"excludedPaths", idx: number) => upd(id,{[field]:(tracking.find(c=>c.id===id)?.[field]??[]).filter((_,i)=>i!==idx)});
  const doSave = () => { saveTrackingCodes(tracking); setSavedStr(JSON.stringify(tracking)); toast.success("Tracking codes salvos"); };
  const discard= () => { const fresh=getTrackingCodes(); setTracking(fresh); setSavedStr(JSON.stringify(fresh)); };

  if (!isOpen) return null;

  return (
    <div className="dark admin-dark fixed inset-0 z-50 flex items-start justify-center p-4 pt-16">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">Tracking Codes</h2>
            {tracking.length > 0 && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{tracking.filter(t=>t.enabled).length}/{tracking.length} ativos</span>}
            {dirty && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">não salvo</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={add} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"><Plus className="h-3.5 w-3.5" /> Adicionar</button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs text-muted-foreground">Adicione Google Analytics, Tag Manager, Meta Pixel, Hotjar etc. Scripts de <code className="bg-muted px-1 rounded font-mono">head</code> injetados via react-helmet; <code className="bg-muted px-1 rounded font-mono">body</code> injetados globalmente.</p>
          {tracking.length === 0 && <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-xs text-muted-foreground">Nenhum tracking code. Clique em "Adicionar".</div>}
          {tracking.length > 1 && <p className="text-[10px] text-muted-foreground">Use ▲▼ para definir a ordem de injeção dentro da mesma posição.</p>}
          <div className="space-y-2">
            {tracking.map((tc, index) => (
              <div key={tc.id} className={`rounded-xl border ${tc.enabled?"border-border":"border-border/40 opacity-60"} bg-background overflow-hidden`}>
                <div className="flex items-center gap-2 px-3 py-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{index+1}</span>
                  <button onClick={()=>upd(tc.id,{enabled:!tc.enabled})} className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${tc.enabled?"bg-primary":"bg-muted-foreground/30"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${tc.enabled?"translate-x-4":"translate-x-0.5"}`}/></button>
                  <button onClick={()=>setExpanded(expanded===tc.id?null:tc.id)} className="flex flex-1 items-center gap-2 text-left min-w-0">
                    <Code className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground"/>
                    <span className="truncate text-sm font-semibold text-foreground">{tc.name||<span className="italic text-muted-foreground">Sem nome</span>}</span>
                    <span className="ml-auto flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{posLabel[tc.position]}</span>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${tc.scope==="global"?"bg-green-500/10 text-green-600":"bg-blue-500/10 text-blue-600"}`}>{tc.scope==="global"?"Global":"Específico"}</span>
                  </button>
                  <div className="flex flex-shrink-0 flex-col">
                    <button onClick={()=>mv(index,index-1)} disabled={index===0} className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5"/></button>
                    <button onClick={()=>mv(index,index+1)} disabled={index===tracking.length-1} className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5"/></button>
                  </div>
                  <button onClick={()=>rem(tc.id)} className="flex-shrink-0 rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><X className="h-3.5 w-3.5"/></button>
                </div>
                {expanded===tc.id && (
                  <div className="border-t border-border px-4 pb-4 pt-4 space-y-4">
                    <div><label className="mb-1 block text-xs font-medium text-foreground">Nome</label><input type="text" value={tc.name} onChange={e=>upd(tc.id,{name:e.target.value})} className={inputClsAdmin} placeholder="Ex: Google Analytics GA4, Meta Pixel..."/></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="mb-1 block text-xs font-medium text-foreground">Posição</label>
                        <select value={tc.position} onChange={e=>upd(tc.id,{position:e.target.value as TrackingPosition})} className={selectClsAdmin}>
                          <option value="head">No &lt;head&gt;</option><option value="body_start">Início do &lt;body&gt;</option><option value="body_end">Fim do &lt;body&gt;</option>
                        </select>
                      </div>
                      <div><label className="mb-1 block text-xs font-medium text-foreground">Escopo</label>
                        <select value={tc.scope} onChange={e=>upd(tc.id,{scope:e.target.value as TrackingScope})} className={selectClsAdmin}>
                          <option value="global">Global</option><option value="specific">Páginas específicas</option>
                        </select>
                      </div>
                    </div>
                    {tc.scope==="global"?(
                      <div><label className="mb-1 block text-xs font-medium text-foreground">Excluir páginas</label>
                        <div className="flex gap-2"><input type="text" value={pathInputs[tc.id]?.exc??""} onChange={e=>setPathInputs(p=>({...p,[tc.id]:{...p[tc.id],exc:e.target.value}}))} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addP(tc.id,"excludedPaths",pathInputs[tc.id]?.exc??"");}}} className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="/pagina/"/>
                        <button onClick={()=>addP(tc.id,"excludedPaths",pathInputs[tc.id]?.exc??"")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"><Plus className="h-3 w-3"/>Add</button></div>
                        <div className="mt-2 flex flex-wrap gap-1.5">{tc.excludedPaths.map((p,i)=><span key={i} className="flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] text-foreground">{p}<button onClick={()=>remP(tc.id,"excludedPaths",i)} className="ml-0.5 text-muted-foreground hover:text-destructive"><X className="h-2.5 w-2.5"/></button></span>)}</div>
                      </div>
                    ):(
                      <div><label className="mb-1 block text-xs font-medium text-foreground">Apenas nestas páginas</label>
                        <div className="flex gap-2"><input type="text" value={pathInputs[tc.id]?.inc??""} onChange={e=>setPathInputs(p=>({...p,[tc.id]:{...p[tc.id],inc:e.target.value}}))} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addP(tc.id,"includedPaths",pathInputs[tc.id]?.inc??"");}}} className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="/pagina/"/>
                        <button onClick={()=>addP(tc.id,"includedPaths",pathInputs[tc.id]?.inc??"")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"><Plus className="h-3 w-3"/>Add</button></div>
                        <div className="mt-2 flex flex-wrap gap-1.5">{tc.includedPaths.map((p,i)=><span key={i} className="flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] text-foreground">{p}<button onClick={()=>remP(tc.id,"includedPaths",i)} className="ml-0.5 text-muted-foreground hover:text-destructive"><X className="h-2.5 w-2.5"/></button></span>)}</div>
                      </div>
                    )}
                    <div><label className="mb-1 block text-xs font-medium text-foreground">Código / Script</label>
                      <textarea value={tc.code} onChange={e=>upd(tc.id,{code:e.target.value})} rows={6} className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder={`<!-- Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>`}/>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div>{dirty&&<span className="text-xs text-amber-600 font-medium">● Alterações não salvas</span>}</div>
          <div className="flex gap-2">
            {dirty&&<button onClick={discard} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">Descartar</button>}
            <button onClick={()=>{if(dirty)doSave();onClose();}} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 ${dirty?"bg-secondary text-secondary-foreground":"border border-border text-foreground hover:bg-muted"}`}>
              {dirty?<><Save className="h-4 w-4"/>Salvar e fechar</>:"Fechar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal de Publicação no GitHub ─────────────────────────────────────────────
interface GitHubPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (config: GitHubPublishConfig) => Promise<void>;
  publishing: boolean;
}

function GitHubPublishModal({ isOpen, onClose, onPublish, publishing }: GitHubPublishModalProps) {
  const saved = loadGitHubConfig();
  const [token, setToken] = useState(saved?.token ?? "");
  const [repo, setRepo] = useState(saved?.repo ?? "lucasalvesjj/comercial-jr-2");
  const [branch, setBranch] = useState(saved?.branch ?? DEFAULT_BRANCH);
  const [filePath, setFilePath] = useState(saved?.filePath ?? DEFAULT_FILE_PATH);
  const [showToken, setShowToken] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!token.trim() || !repo.trim()) return;
    const config: GitHubPublishConfig = { token: token.trim(), repo: repo.trim(), branch: branch.trim() || DEFAULT_BRANCH, filePath: filePath.trim() || DEFAULT_FILE_PATH };
    saveGitHubConfig(config);
    void onPublish(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">Publicar no GitHub</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-600">
              O token é salvo apenas no <strong>localStorage deste navegador</strong>, nunca enviado a servidores externos. Use um token com escopo <code className="bg-black/10 px-1 rounded">contents:write</code> apenas para este repositório.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Personal Access Token (PAT)</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-16 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={() => setShowToken((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                {showToken ? "ocultar" : "mostrar"}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Crie em{" "}
              <a href="https://github.com/settings/tokens/new?scopes=repo&description=Comercial+JR+Blog+Admin" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2">
                github.com/settings/tokens <ExternalLink className="h-3 w-3" />
              </a>
              {" "}com escopo <code className="bg-muted px-1 rounded">repo</code> ou <code className="bg-muted px-1 rounded">contents:write</code>.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Repositório</label>
            <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="usuario/nome-do-repo" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Branch</label>
              <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Caminho do arquivo</label>
              <input type="text" value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="public/data/blog-posts.json" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {saved?.token && (
            <button type="button" onClick={() => { clearGitHubConfig(); setToken(""); }} className="text-xs text-destructive underline underline-offset-2 hover:opacity-80">
              Remover token salvo
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={publishing || !token.trim() || !repo.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {publishing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {publishing ? "Publicando..." : "Publicar agora"}
          </button>
        </div>
      </div>
    </div>
  );
}

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const {
    categories,
    posts,
    source,
    loading,
    init,
    addCategory,
    addPost,
    updatePost,
    deletePost,
    getPost,
    importPosts,
    exportFile,
    isSlugUnique,
    resetToPublished,
    toggleCategoryVisibility,
  } = useBlogStore();

  const [view, setView] = useState<"list" | "edit" | "seo-global">(
    () => (sessionStorage.getItem("admin-view") as "list" | "edit" | "seo-global") || "list"
  );
  const [editingSlug, setEditingSlug] = useState<string | null>(
    () => sessionStorage.getItem("admin-editing-slug")
  );

  useEffect(() => {
    sessionStorage.setItem("admin-view", view);
    if (editingSlug) {
      sessionStorage.setItem("admin-editing-slug", editingSlug);
    } else {
      sessionStorage.removeItem("admin-editing-slug");
    }
  }, [view, editingSlug]);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [copiedItem, setCopiedItem] = useState<"path" | "filename" | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [visibleCount, setVisibleCount] = useState(POSTS_PAGE_SIZE);
  const [publicationModalOpen, setPublicationModalOpen] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [codesModalOpen, setCodesModalOpen] = useState(false);
  const [codesFromMenu, setCodesFromMenu] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleGitHubPublish = async (config: GitHubPublishConfig) => {
    setPublishing(true);
    try {
      const jsonContent = JSON.stringify(exportFile(), null, 2);
      const result = await publishToGitHub(jsonContent, config);
      if (result.ok) {
        toast.success("✅ Blog publicado no GitHub com sucesso!", {
          description: result.commitUrl ? "Clique para ver o commit" : undefined,
          action: result.commitUrl ? { label: "Ver commit", onClick: () => window.open(result.commitUrl, "_blank") } : undefined,
          duration: 8000,
        });
        setGithubModalOpen(false);
      } else {
        toast.error("Falha ao publicar no GitHub", { description: result.error, duration: 8000 });
      }
    } finally {
      setPublishing(false);
    }
  };

  // Estabiliza o nome do backup para evitar stale closure nos botões de cópia
  const stableExportName = useMemo(() => `blog-posts-backup_${formatExportDate()}.json`, []);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    setVisibleCount(POSTS_PAGE_SIZE);
  }, [search, filterCat, filterStatus, sortField, sortDirection, posts.length]);

  const filtered = useMemo(
    () =>
      posts
        .filter((post) => filterCat === "all" || post.categories.includes(filterCat))
        .filter((post) => filterStatus === "all" || post.status === filterStatus)
        .filter((post) => !search || post.title.toLowerCase().includes(search.toLowerCase()) || post.slug.includes(search.toLowerCase())),
    [posts, search, filterCat, filterStatus]
  );

  const sortedPosts = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortField === "date") {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction;
      }

      if (sortField === "status") {
        const statusOrder = { published: 1, draft: 0 };
        return (statusOrder[a.status] - statusOrder[b.status]) * direction;
      }

      if (sortField === "category") {
        const categoryA = getPostCategories(a).map((categoryId) => getCategoryLabel(categoryId, categories)).join(", ");
        const categoryB = getPostCategories(b).map((categoryId) => getCategoryLabel(categoryId, categories)).join(", ");
        return categoryA.localeCompare(categoryB, "pt-BR", { sensitivity: "base" }) * direction;
      }

      return a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" }) * direction;
    });
  }, [categories, filtered, sortDirection, sortField]);

  const visiblePosts = useMemo(() => sortedPosts.slice(0, visibleCount), [sortedPosts, visibleCount]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || visibleCount >= sortedPosts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + POSTS_PAGE_SIZE, sortedPosts.length));
        }
      },
      { rootMargin: "160px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [sortedPosts.length, visibleCount]);

  const stats = useMemo(
    () => ({
      total: posts.length,
      published: posts.filter((post) => post.status === "published").length,
      draft: posts.filter((post) => post.status === "draft").length,
      categories: categories.length,
    }),
    [categories.length, posts]
  );

  const exportName = stableExportName;

  const copyText = async (value: string, type: "path" | "filename") => {
    const markCopied = () => {
      setCopiedItem(type);
      toast.success("Copiado para a área de transferência");
      window.setTimeout(() => setCopiedItem(null), 1800);
    };

    // Tenta clipboard moderno (requer HTTPS ou localhost)
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        markCopied();
        return;
      } catch {
        // cai no fallback abaixo
      }
    }

    // Fallback via execCommand (funciona em HTTP e ambientes sem permissão de clipboard)
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        markCopied();
      } else {
        toast.error("Não consegui copiar automaticamente");
      }
    } catch {
      toast.error("Não consegui copiar automaticamente");
    }
  };

  const handleDelete = (slug: string) => {
    if (window.confirm("Tem certeza que deseja excluir este post?")) {
      deletePost(slug);
      toast.success("Post excluído com sucesso");
    }
  };

  const handleDuplicate = (post: BlogPost) => {
    const duplicatedPost: BlogPost = {
      ...post,
      slug: buildDuplicateSlug(post.slug, posts.map((item) => item.slug)),
      title: buildDuplicateTitle(post.title, posts.map((item) => item.title)),
      status: "draft",
    };

    try {
      addPost(duplicatedPost);
      toast.success("Post duplicado com sucesso");
    } catch {
      toast.error("Não foi possível duplicar o post porque o slug já existe");
    }
  };

  const downloadJson = (filename: string) => {
    const data = JSON.stringify(exportFile(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedContent = parseBlogImport(event.target?.result as string);
          importPosts(importedContent);
          toast.success(`${importedContent.posts.length} posts e ${importedContent.categories.length} categorias carregados na sua cópia local`);
        } catch {
          toast.error("Arquivo JSON inválido para o blog");
        }
      };

      reader.readAsText(file);
    };
    input.click();
  };

  const handleAddCategory = (label: string) => {
    try {
      const created = addCategory(label);
      toast.success(`Categoria "${created.label}" criada com sucesso`);
    } catch (error) {
      if (error instanceof Error && (error.message === "duplicate-category" || error.message === "empty-category")) {
        toast.error(error.message === "duplicate-category" ? "Já existe uma categoria com esse nome" : "Digite um nome para criar a categoria");
        return;
      }
      toast.error("Não foi possível criar a categoria");
    }
  };

  const handleSave = (post: BlogPost, isNew: boolean) => {
    try {
      if (isNew) {
        addPost(post);
        toast.success("Post criado com sucesso");
      } else if (editingSlug) {
        updatePost(editingSlug, post);
        toast.success("Post atualizado com sucesso");
      }
    } catch {
      toast.error("Não foi possível salvar. Esta URL já existe em outro post.");
      return;
    }

    setView("list");
    setEditingSlug(null);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "title" || field === "category" ? "asc" : "desc");
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => {
    const active = sortField === field;

    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className={`inline-flex items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:text-primary ${active ? "text-primary" : ""}`}
      >
        <span>{label}</span>
        <span className="inline-flex items-center rounded border border-border bg-background/80 px-1 py-0.5">
          {active && sortDirection === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5 text-primary" />
          ) : active && sortDirection === "desc" ? (
            <ChevronDown className="h-3.5 w-3.5 text-primary" />
          ) : (
            <span className="inline-flex flex-col text-muted-foreground/70">
              <ChevronUp className="h-3 w-3" />
              <ChevronDown className="-mt-1 h-3 w-3" />
            </span>
          )}
        </span>
      </button>
    );
  };

  if (view === "edit") {
    const post = editingSlug ? getPost(editingSlug) : undefined;
    return (
      <Suspense fallback={<AdminViewFallback label="editor" />}>
        <AdminPostEditor
          post={post}
          categories={categories}
          onSave={handleSave}
          onDelete={(slug) => {
            handleDelete(slug);
            setView("list");
            setEditingSlug(null);
          }}
          onCancel={() => {
            setView("list");
            setEditingSlug(null);
          }}
          isSlugUnique={(slug) => isSlugUnique(slug, editingSlug || undefined)}
        />
      </Suspense>
    );
  }

  if (view === "seo-global") {
    return (
      <Suspense fallback={<AdminViewFallback label="SEO" />}>
        <AdminSeoEditor
          onBack={() => { setView("list"); setCodesFromMenu(false); }}
        />
      </Suspense>
    );
  }

  const currentSource = sourceMeta[source];
  const SourceIcon = currentSource.icon;

  return (
    <div className="dark admin-dark min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Admin — Comercial JR</title>
        <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noodp,noimageindex,noai" />
        <meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet,noimageindex" />
        <meta name="bingbot" content="noindex,nofollow,noarchive,nosnippet" />
        <meta name="referrer" content="no-referrer" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Admin" />
        <meta property="og:description" content="" />
        <meta property="og:image" content="" />
        <meta name="description" content="" />
        <link rel="canonical" href="https://comercialjrltda.com.br/" />
      </Helmet>
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="container-custom flex h-14 items-center gap-6">
          {/* Logo */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <span className="rounded bg-primary-foreground px-2 py-0.5 font-heading text-sm font-black text-primary">JR</span>
            <span className="font-heading text-sm font-bold">Admin</span>
          </div>

          {/* Nav — alinhado à esquerda, cresce */}
          <div className="flex flex-1 items-center gap-1">
            <Link to="/admin/media" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <ImageIcon className="h-4 w-4" />
              Mídia
            </Link>
            <button
              onClick={() => setCategoriesModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Tags className="h-4 w-4" />
              Categorias
            </button>
            <button
              onClick={() => setView("seo-global")}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" />
              SEO
            </button>
            <button
              onClick={() => setCodesModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Terminal className="h-4 w-4" />
              Codes
            </button>
          </div>

          {/* Ver Site + Sair — agrupados à direita */}
          <div className="flex flex-shrink-0 items-center gap-1">
            <Link to="/" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Eye className="h-4 w-4" />
              Ver Site
            </Link>
            <button onClick={onLogout} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <CodesModal isOpen={codesModalOpen} onClose={() => setCodesModalOpen(false)} />

      <GitHubPublishModal
        isOpen={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        onPublish={handleGitHubPublish}
        publishing={publishing}
      />

      <CategoryModal
        isOpen={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        categories={categories}
        onAdd={handleAddCategory}
        onToggleVisibility={toggleCategoryVisibility}
      />

      <PublicationModal
        isOpen={publicationModalOpen}
        onClose={() => setPublicationModalOpen(false)}
        source={source}
        exportName={exportName}
        blogDataPath={BLOG_DATA_PATH}
        copiedItem={copiedItem}
        loading={loading}
        onCopyText={copyText}
        onDownloadJson={downloadJson}
        onResetToPublished={() =>
          void resetToPublished().then(() => toast.success("Cópia local recarregada a partir da versão publicada"))
        }
      />

      <div className="container-custom py-6">
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${currentSource.tone}`}>
                <SourceIcon className="h-4 w-4" />
                {currentSource.label}
              </div>
              <h1 className="mt-3 font-heading text-2xl font-bold text-foreground">Gestão de Posts</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Edite aqui na sua máquina, exporte o JSON e substitua esse mesmo arquivo no servidor.
                O site publicado vai ler sempre de <code className="ml-1 rounded bg-muted px-1.5 py-0.5">{BLOG_DATA_PATH}</code>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setEditingSlug(null); setView("edit"); }} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                <Plus className="h-4 w-4" />
                Novo Post
              </button>
              <button onClick={() => setPublicationModalOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                <BookOpen className="h-4 w-4" />
                Publicação
              </button>
              <button onClick={() => { downloadJson("blog-posts.json"); toast.success("Arquivo principal pronto para envio ao servidor"); }} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                <Download className="h-4 w-4" />
                Exportar Publicação
              </button>
              <button
                onClick={() => setGithubModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Github className="h-4 w-4" />
                Publicar no GitHub
              </button>
              <button onClick={handleImport} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                <Upload className="h-4 w-4" />
                Importar JSON
              </button>
              <button onClick={() => void resetToPublished().then(() => toast.success("Cópia local recarregada a partir da versão publicada"))} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Recarregar Publicado
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total", value: stats.total, icon: FileText, color: "text-primary", onClick: undefined },
            { label: "Publicados", value: stats.published, icon: CheckCircle, color: "text-brand-green", onClick: undefined },
            { label: "Rascunhos", value: stats.draft, icon: Clock, color: "text-brand-orange", onClick: undefined },
            { label: "Categorias", value: stats.categories, icon: FolderPlus, color: "text-primary", onClick: () => setCategoriesModalOpen(true) },
          ].map((item) => (
            <div
              key={item.label}
              onClick={item.onClick}
              className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 ${item.onClick ? "cursor-pointer transition-colors hover:bg-accent" : ""}`}
            >
              <item.icon className={`h-8 w-8 ${item.color}`} />
              <div>
                <div className="font-heading text-2xl font-black text-foreground">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por título ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="all">Todas categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="all">Todos status</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1">
              Ordem atual: {sortField === "date" ? (sortDirection === "desc" ? "Mais recentes" : "Mais antigos") : sortField === "status" ? (sortDirection === "desc" ? "Publicados primeiro" : "Rascunhos primeiro") : sortField === "category" ? (sortDirection === "asc" ? "Categoria A-Z" : "Categoria Z-A") : sortDirection === "asc" ? "Título A-Z" : "Título Z-A"}
            </span>
            <span className="rounded-full bg-muted px-3 py-1">Exibindo {Math.min(visiblePosts.length, sortedPosts.length)} de {sortedPosts.length}</span>
          </div>
          {visiblePosts.length < sortedPosts.length && <span>Role para carregar mais posts</span>}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-heading font-semibold text-foreground"><SortButton field="title" label="Título" /></th>
                  <th className="hidden min-w-[210px] px-4 py-3 text-left font-heading font-semibold text-foreground md:table-cell"><SortButton field="category" label="Categoria" /></th>
                  <th className="hidden px-4 py-3 text-left font-heading font-semibold text-foreground lg:table-cell"><SortButton field="date" label="Data" /></th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-foreground"><SortButton field="status" label="Status" /></th>
                  <th className="px-4 py-3 text-right font-heading font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visiblePosts.map((post) => {
                  const postCategories = getPostCategories(post);
                  return (
                    <tr key={post.slug} className="border-b border-border transition-colors hover:bg-muted/30 last:border-0">
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => { setEditingSlug(post.slug); setView("edit"); }} className="line-clamp-1 text-left font-medium text-foreground transition-colors hover:text-primary" title="Abrir para editar">
                          {post.title}
                        </button>
                        <div className="mt-0.5 text-xs text-muted-foreground">/{post.slug}/</div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {postCategories.map((categoryId) => (
                            <span key={categoryId} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getCategoryTone(categoryId, categories)}`}>
                              {getCategoryLabel(categoryId, categories)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{new Date(post.date).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${post.status === "published" ? "bg-brand-green/10 text-brand-green" : "bg-brand-orange/10 text-brand-orange"}`}>
                          {post.status === "published" ? "Publicado" : "Rascunho"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/${post.slug}/`} target="_blank" className="rounded p-1.5 text-muted-foreground transition-colors hover:text-primary" title="Ver"><Eye className="h-4 w-4" /></Link>
                          <button onClick={() => handleDuplicate(post)} className="rounded p-1.5 text-muted-foreground transition-colors hover:text-primary" title="Duplicar"><Copy className="h-4 w-4" /></button>
                          <button onClick={() => { setEditingSlug(post.slug); setView("edit"); }} className="rounded p-1.5 text-muted-foreground transition-colors hover:text-primary" title="Editar"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(post.slug)} className="rounded p-1.5 text-muted-foreground transition-colors hover:text-destructive" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedPosts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Nenhum post encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {visiblePosts.length < sortedPosts.length && (
          <div ref={loadMoreRef} className="mt-4 rounded-lg border border-dashed border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
            Carregando mais posts ao rolar...
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">{sortedPosts.length} de {posts.length} posts encontrados</p>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ADMIN_AUTH_KEY) === "true";
  });
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    window.localStorage.setItem(ADMIN_AUTH_KEY, "true");
    setAuthenticated(true);
  };

  const handleLogout = () => {
    window.localStorage.removeItem(ADMIN_AUTH_KEY);
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <div className="dark admin-dark flex min-h-screen items-center justify-center bg-background p-4">
        <Helmet>
          <title>Admin — Comercial JR</title>
          <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noodp,noimageindex,noai" />
          <meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet,noimageindex" />
          <meta name="bingbot" content="noindex,nofollow,noarchive,nosnippet" />
          <meta name="referrer" content="no-referrer" />
          <meta name="description" content="" />
          <link rel="canonical" href="https://comercialjrltda.com.br/" />
        </Helmet>
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <span className="rounded bg-primary px-3 py-1.5 font-heading text-lg font-black text-primary-foreground">JR</span>
            <h1 className="mt-4 font-heading text-xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Digite a senha para acessar</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              password === ADMIN_PASS ? handleLogin() : toast.error("Senha incorreta");
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="mb-4 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
};

export default AdminPage;