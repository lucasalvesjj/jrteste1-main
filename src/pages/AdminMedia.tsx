// ──────────────────────────────────────────────
// AdminMedia — Página de gerenciamento da Biblioteca de Mídia
// Rota: /admin/media
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Eye, LogOut, Search, Upload, Trash2, X,
  Loader2, ImageIcon, FileImage, Calendar, HardDrive,
  Maximize2, AlertTriangle, Check,
} from "lucide-react";
import { toast } from "sonner";
import { useMediaStore } from "@/stores/mediaStore";
import type { MediaSortBy } from "@/stores/mediaStore";
import { validateMediaFile, ACCEPTED_EXTENSIONS } from "@/data/mediaTypes";
import type { MediaItem, MediaSourceType } from "@/data/mediaTypes";
import { MediaUsageSection } from "@/components/admin/media/MediaUsageSection";

const ADMIN_AUTH_KEY = "comercial-jr-admin-authenticated";
const ADMIN_PASS = "0";

const SOURCE_TYPE_OPTIONS: { value: MediaSourceType | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "post", label: "Posts" },
  { value: "page", label: "Páginas" },
  { value: "standalone", label: "Avulsas" },
];

const SORT_OPTIONS: { value: MediaSortBy; label: string }[] = [
  { value: "date-desc", label: "Mais recentes" },
  { value: "date-asc", label: "Mais antigos" },
  { value: "name-asc", label: "Nome A→Z" },
  { value: "name-desc", label: "Nome Z→A" },
  { value: "size-desc", label: "Maior tamanho" },
  { value: "size-asc", label: "Menor tamanho" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

// ── Thumbnail ────────────────────────────────
function MediaThumb({ item, isSelected, onClick }: {
  item: MediaItem; isSelected: boolean; onClick: () => void;
}) {
  const [err, setErr] = useState(false);
  return (
    <button onClick={onClick} title={item.name}
      className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-ring ${isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-border"}`}>
      {!err ? (
        <img src={item.paths.thumbnail} alt={item.alt || item.name} loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={() => setErr(true)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <FileImage className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="block truncate text-xs text-white">{item.name}</span>
      </div>
    </button>
  );
}

// ── Painel de detalhes ───────────────────────
function MediaDetailPanel({ item, onDelete }: { item: MediaItem; onDelete: () => void }) {
  const [previewError, setPreviewError] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(item.paths.original);
      setCopied(true);
      toast.success("URL copiada");
      setTimeout(() => setCopied(false), 1800);
    } catch { toast.error("Não foi possível copiar"); }
  };

  return (
    <div className="flex w-[300px] flex-shrink-0 flex-col overflow-hidden border-l border-border bg-card">
      <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden bg-muted">
        {!previewError ? (
          <img src={item.paths.medium} alt={item.alt || item.name}
            className="h-full w-full object-contain" onError={() => setPreviewError(true)} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileImage className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-xs text-muted-foreground">
        <h3 className="mb-3 truncate text-sm font-semibold text-foreground" title={item.name}>{item.name}</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 flex-shrink-0" /><span>Data:</span><span className="text-foreground">{formatDate(item.uploadedAt)}</span></div>
          <div className="flex items-center gap-2"><Maximize2 className="h-3.5 w-3.5 flex-shrink-0" /><span>Dimensões:</span><span className="text-foreground">{item.width} × {item.height}px</span></div>
          <div className="flex items-center gap-2"><HardDrive className="h-3.5 w-3.5 flex-shrink-0" /><span>Tamanho:</span><span className="text-foreground">{formatFileSize(item.size)}</span></div>
        </div>
        <MediaUsageSection item={item} />
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-1 font-medium text-foreground">URL</div>
          <div className="break-all rounded bg-muted px-2 py-1.5 font-mono text-[10px] leading-relaxed">{item.paths.original}</div>
          <button onClick={copyUrl} className="mt-2 flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent">
            <Check className={`h-3.5 w-3.5 transition-opacity ${copied ? "opacity-100 text-green-500" : "opacity-0"}`} />
            {copied ? "Copiado!" : "Copiar URL"}
          </button>
        </div>
      </div>
      <div className="flex-shrink-0 border-t border-border p-3">
        <button onClick={onDelete} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" /> Remover mídia
        </button>
      </div>
    </div>
  );
}

// ── Conteúdo principal ───────────────────────
const AdminMediaContent = ({ onLogout }: { onLogout: () => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const items = useMediaStore((s) => s.items);
  const loadState = useMediaStore((s) => s.loadState);
  const error = useMediaStore((s) => s.error);
  const uploading = useMediaStore((s) => s.uploading);
  const uploadingPlaceholder = useMediaStore((s) => s.uploadingPlaceholder);
  const filters = useMediaStore((s) => s.filters);
  const loadItems = useMediaStore((s) => s.loadItems);
  const uploadItem = useMediaStore((s) => s.uploadItem);
  const deleteItem = useMediaStore((s) => s.deleteItem);
  const setFilters = useMediaStore((s) => s.setFilters);
  const clearFilters = useMediaStore((s) => s.clearFilters);
  const getFilteredItems = useMediaStore((s) => s.getFilteredItems);

  useEffect(() => { clearFilters(); loadItems(); }, []); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(() => setFilters({ search: searchInput || undefined }), 200);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line

  const filteredItems = useMemo(() => getFilteredItems(), [items, filters]); // eslint-disable-line
  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);
  const hasActiveFilter = !!filters.sourceType || !!filters.search;
  const isFiltered = filteredItems.length !== items.length;

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const v = validateMediaFile(file);
    if (!v.valid) { toast.error(v.error); return; }
    try {
      const uploaded = await uploadItem(file);
      setSelectedId(uploaded.id);
      toast.success(`"${file.name}" enviado com sucesso!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadItem]); // eslint-disable-line

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!window.confirm(`Remover "${name}" da biblioteca?`)) return;
    try {
      await deleteItem(id);
      if (selectedId === id) setSelectedId(null);
      toast.success(`"${name}" removido.`);
    } catch { toast.error("Erro ao remover mídia."); }
  }, [deleteItem, selectedId]); // eslint-disable-line

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); }
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current = 0; setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]); // eslint-disable-line

  return (
    <div className="dark admin-dark min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Admin Mídia — Comercial JR</title>
        <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noodp,noimageindex,noai" />
        <meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet,noimageindex" />
        <meta name="bingbot" content="noindex,nofollow,noarchive,nosnippet" />
        <meta name="referrer" content="no-referrer" />
        <meta name="description" content="" />
        <link rel="canonical" href="https://comercialjrltda.com.br/" />
      </Helmet>
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="container-custom flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded bg-primary-foreground px-2 py-0.5 font-heading text-sm font-black text-primary">JR</span>
            <span className="font-heading text-sm font-bold">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <ArrowLeft className="h-4 w-4" /> Voltar ao Admin
            </Link>
            <Link to="/" className="flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Eye className="h-4 w-4" /> Ver Site
            </Link>
            <button onClick={onLogout} className="ml-1 flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container-custom py-6">
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-bold text-foreground">Biblioteca de Mídia</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie todas as imagens — upload, visualização, filtros e remoção.</p>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          style={{ height: "calc(100vh - 200px)", minHeight: 500 }}
          onDragEnter={handleDragEnter} onDragOver={handleDragOver}
          onDragLeave={handleDragLeave} onDrop={handleDrop}>

          {isDragging && (
            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary bg-background/90 px-12 py-8">
                <Upload className="h-10 w-10 text-primary" />
                <span className="text-lg font-semibold text-primary">Solte o arquivo aqui</span>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-5 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar..." className="h-9 w-52 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              {searchInput && (
                <button onClick={() => setSearchInput("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS}
                onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-border px-5 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Origem:</span>
              <div className="flex gap-1">
                {SOURCE_TYPE_OPTIONS.map((opt) => {
                  const isActive = opt.value === "all" ? !filters.sourceType : filters.sourceType === opt.value;
                  return (
                    <button key={opt.value}
                      onClick={() => setFilters({ sourceType: opt.value === "all" ? undefined : opt.value as MediaSourceType })}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Ordenar:</span>
              <select value={filters.sortBy || "date-desc"}
                onChange={(e) => setFilters({ sortBy: e.target.value as MediaSortBy })}
                className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            {hasActiveFilter && (
              <>
                <div className="h-5 w-px bg-border" />
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {isFiltered ? `${filteredItems.length} de ${items.length}` : `${items.length} mídias`}
                </span>
                <button onClick={() => { setSearchInput(""); clearFilters(); }}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-3 w-3" /> Limpar filtros
                </button>
              </>
            )}
          </div>

          {/* Corpo: grid + painel lateral */}
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              {loadState === "loading" && (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm">Carregando mídias...</span>
                  </div>
                </div>
              )}
              {loadState === "error" && (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-destructive">
                    <AlertTriangle className="h-8 w-8" />
                    <span className="text-sm">{error || "Erro ao carregar mídias"}</span>
                    <button onClick={loadItems} className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">Tentar novamente</button>
                  </div>
                </div>
              )}
              {loadState === "loaded" && filteredItems.length === 0 && !uploadingPlaceholder && (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 opacity-40" />
                    {filters.search ? (
                      <>
                        <span className="text-sm">Nenhum resultado para "{filters.search}"</span>
                        <button onClick={() => { setSearchInput(""); clearFilters(); }} className="text-sm text-primary hover:underline">Limpar busca</button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium">Biblioteca vazia</span>
                        <span className="text-xs">Clique em "Enviar" ou arraste uma imagem</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              {loadState === "loaded" && (filteredItems.length > 0 || uploadingPlaceholder) && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                  {uploadingPlaceholder && (
                    <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-primary/50 bg-muted/50">
                      <img src={uploadingPlaceholder.previewUrl} alt={uploadingPlaceholder.name} className="h-full w-full object-cover opacity-50" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="px-2 text-center text-[10px] font-medium text-primary">{uploadingPlaceholder.progress}</span>
                      </div>
                    </div>
                  )}
                  {filteredItems.map((item) => (
                    <MediaThumb key={item.id} item={item} isSelected={selectedId === item.id}
                      onClick={() => setSelectedId(selectedId === item.id ? null : item.id)} />
                  ))}
                </div>
              )}
            </div>
            {selectedItem && (
              <MediaDetailPanel item={selectedItem}
                onDelete={() => handleDelete(selectedItem.id, selectedItem.name)} />
            )}
          </div>

          {/* Status bar */}
          <div className="flex-shrink-0 border-t border-border bg-card px-5 py-2 text-xs text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? "mídia" : "mídias"}
            {filters.search && " (filtrado)"}
            {selectedItem && <span className="ml-2 font-medium text-primary">· {selectedItem.name} selecionada</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Página com guarda de autenticação ────────
const AdminMediaPage = () => {
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ADMIN_AUTH_KEY) === "true";
  });
  const [password, setPassword] = useState("");

  const handleLogin = () => { window.localStorage.setItem(ADMIN_AUTH_KEY, "true"); setAuthenticated(true); };
  const handleLogout = () => { window.localStorage.removeItem(ADMIN_AUTH_KEY); setAuthenticated(false); };

  if (!authenticated) {
    return (
      <div className="dark admin-dark flex min-h-screen items-center justify-center bg-background p-4">
        <Helmet>
          <title>Admin Mídia — Comercial JR</title>
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
          <form onSubmit={(e) => { e.preventDefault(); password === ADMIN_PASS ? handleLogin() : toast.error("Senha incorreta"); }}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha" className="mb-4 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminMediaContent onLogout={handleLogout} />;
};

export default AdminMediaPage;
