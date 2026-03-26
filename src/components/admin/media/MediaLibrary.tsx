// ──────────────────────────────────────────────
// MediaLibrary — Modal principal da biblioteca de mídia
// ──────────────────────────────────────────────
// Modal fullscreen-like com:
//  - Header com título, busca e botão de upload
//  - Grid responsivo de thumbnails (memoizado)
//  - Placeholder visual durante upload
//  - Painel lateral com detalhes da mídia selecionada
//  - Estados: loading, empty, error
//  - Drag & drop com counter para evitar interferência
// ──────────────────────────────────────────────

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
  AlertTriangle,
  FileImage,
  Calendar,
  HardDrive,
  Maximize2,
  Pencil,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { updateMediaAlt, getMediaAltOverride } from "@/lib/mediaApi";
import { MediaUsageSection } from "@/components/admin/media/MediaUsageSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMediaStore } from "@/stores/mediaStore";
import type { UploadingPlaceholder, MediaSortBy } from "@/stores/mediaStore";
import { validateMediaFile, ACCEPTED_EXTENSIONS } from "@/data/mediaTypes";
import type { MediaItem, MediaSourceType } from "@/data/mediaTypes";
import type { MediaLibraryModalProps } from "@/hooks/useMediaLibrary";

// ──────────────────────────────────────────────
// Constantes de filtros
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────

export default function MediaLibrary({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  mode = "single",
  autoClose: _autoClose = true,
  title = "Biblioteca de Mídia",
  initialSourceType,
  initialSourceId,
}: MediaLibraryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState("");

  /**
   * Controla se o filtro inicial já foi aplicado nesta instância do modal.
   * Garante que initialSourceType/initialSourceId sejam aplicados APENAS
   * na primeira abertura — não sobrescrevendo filtros do usuário nas
   * aberturas subsequentes.
   */
  const hasInitializedFiltersRef = useRef(false);

  // ── Store (seletores granulares para evitar re-renders) ──
  const items = useMediaStore((s) => s.items);
  const loadState = useMediaStore((s) => s.loadState);
  const error = useMediaStore((s) => s.error);
  const selectedId = useMediaStore((s) => s.selectedId);
  const selectedIds = useMediaStore((s) => s.selectedIds);
  const uploading = useMediaStore((s) => s.uploading);
  const uploadingPlaceholder = useMediaStore((s) => s.uploadingPlaceholder);
  const filters = useMediaStore((s) => s.filters);

  const loadItems = useMediaStore((s) => s.loadItems);
  const uploadItem = useMediaStore((s) => s.uploadItem);
  const deleteItem = useMediaStore((s) => s.deleteItem);
  const selectItem = useMediaStore((s) => s.selectItem);
  const toggleSelectItem = useMediaStore((s) => s.toggleSelectItem);
  const getSelectedItems = useMediaStore((s) => s.getSelectedItems);
  const setFilters = useMediaStore((s) => s.setFilters);
  const clearFilters = useMediaStore((s) => s.clearFilters);
  const softReset = useMediaStore((s) => s.softReset);
  const getFilteredItems = useMediaStore((s) => s.getFilteredItems);

  // ── Carregar mídias ao abrir ──
  // Filtro inicial (initialSourceType/initialSourceId) é aplicado APENAS
  // na primeira abertura do modal (hasInitializedFiltersRef). Nas aberturas
  // seguintes, o estado de filtros do usuário é preservado.
  useEffect(() => {
    if (isOpen) {
      loadItems();
      if (!hasInitializedFiltersRef.current && (initialSourceType || initialSourceId)) {
        setFilters({
          sourceType: initialSourceType,
          sourceId: initialSourceId,
        });
        hasInitializedFiltersRef.current = true;
      }
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bloqueia download do navegador ao soltar arquivo fora do drop zone ──
  // O DialogContent do Radix usa portal — sem este listener global, o navegador
  // intercepta o drop e abre/baixa o arquivo quando solto fora da área do modal.
  // Ativo apenas enquanto o modal estiver aberto.
  useEffect(() => {
    if (!isOpen) return;
    const prevent = (e: DragEvent) => {
      e.preventDefault();
    };
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);
    return () => {
      document.removeEventListener("dragover", prevent);
      document.removeEventListener("drop", prevent);
    };
  }, [isOpen]);

  // ── Soft reset ao fechar — limpa seleção e filtros de contexto ──
  const handleClose = useCallback(() => {
    softReset();
    // Reseta o ref para que o filtro inicial seja reaplicado
    // corretamente na próxima abertura deste mesmo modal
    hasInitializedFiltersRef.current = false;
    onClose();
  }, [onClose, softReset]);

  // ── Busca com debounce simples ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchInput || undefined });
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput, setFilters]);

  // Sincronizar searchInput com filters.search ao reabrir
  // (quando filters persistem do último uso)
  useEffect(() => {
    if (isOpen && filters.search && !searchInput) {
      setSearchInput(filters.search);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Upload ──
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      try {
        await uploadItem(file);
        toast.success(`"${file.name}" enviado com sucesso!`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro no upload";
        toast.error(message);
      }

      // Limpa o input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadItem]
  );

  // ── Drag & Drop com counter para evitar flicker ──
  // Ajuste #6: dragCounter evita que dragLeave de filhos
  // cancele o estado de drag do container pai
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    // Só mostra overlay se tem arquivos (ignora drag de texto/elementos internos)
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Não stopPropagation aqui — permite scroll nativo
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      // Só processa se tem arquivos
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect]
  );

  // ── Delete ──
  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!window.confirm(`Remover "${name}" da biblioteca?`)) return;

      try {
        await deleteItem(id);
        toast.success(`"${name}" removido.`);
      } catch {
        toast.error("Erro ao remover mídia.");
      }
    },
    [deleteItem]
  );

  // ── Dados derivados (memoizados) ──
  // Devem ficar ANTES de handleConfirmSelect que os referencia
  const isMultiple = mode === "multiple";
  const filteredItems = useMemo(() => getFilteredItems(), [items, filters]);
  const memoizedSelectedItems = useMemo(() => getSelectedItems(), [items, selectedIds]);
  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId]
  );
  const selectionCount = isMultiple ? selectedIds.length : (selectedId ? 1 : 0);
  const hasSelection = selectionCount > 0;

  // ── Confirmar seleção ──
  const handleConfirmSelect = useCallback(() => {
    if (mode === "multiple") {
      if (memoizedSelectedItems.length > 0) {
        onSelectMultiple(memoizedSelectedItems);
      }
    } else {
      const item = items.find((i) => i.id === selectedId);
      if (item) {
        onSelect(item);
      }
    }
  }, [mode, items, selectedId, onSelect, onSelectMultiple, memoizedSelectedItems]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="dark admin-dark flex h-[85vh] max-h-[900px] w-[95vw] max-w-6xl flex-col gap-0 overflow-hidden p-0"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* ── Drag overlay (pointer-events-none para não interferir) ── */}
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary bg-background/90 px-12 py-8">
              <Upload className="h-10 w-10 text-primary" />
              <span className="text-lg font-semibold text-primary">Solte o arquivo aqui</span>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <DialogHeader className="flex-1">
            <DialogTitle className="font-heading text-lg font-bold">{title}</DialogTitle>
            <DialogDescription className="sr-only">
              Selecione ou envie imagens para a biblioteca de mídia
            </DialogDescription>
          </DialogHeader>

          {/* Busca + Upload */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar..."
                className="h-9 w-48 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>

        {/* ── Filter bar (visível mesmo com resultados vazios) ── */}
        {loadState === "loaded" && (
          <MediaFilterBar
            activeSourceType={filters.sourceType}
            activeSearch={filters.search}
            activeSortBy={filters.sortBy || "date-desc"}
            onSourceTypeChange={(value) =>
              setFilters({ sourceType: value === "all" ? undefined : value as MediaSourceType })
            }
            onSortByChange={(value) => setFilters({ sortBy: value })}
            onClearFilters={() => {
              setSearchInput("");
              clearFilters();
            }}
            totalCount={items.length}
            filteredCount={filteredItems.length}
          />
        )}

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Grid area ── */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Loading */}
            {loadState === "loading" && (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm">Carregando mídias...</span>
                </div>
              </div>
            )}

            {/* Error */}
            {loadState === "error" && (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-destructive">
                  <AlertTriangle className="h-8 w-8" />
                  <span className="text-sm">{error || "Erro ao carregar mídias"}</span>
                  <button
                    onClick={loadItems}
                    className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}

            {/* Empty (sem placeholder e sem itens) */}
            {loadState === "loaded" && filteredItems.length === 0 && !uploadingPlaceholder && (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 opacity-40" />
                  {filters.search ? (
                    <>
                      <span className="text-sm">
                        Nenhum resultado para "{filters.search}"
                      </span>
                      <button
                        onClick={() => {
                          setSearchInput("");
                          clearFilters();
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        Limpar busca
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium">Biblioteca vazia</span>
                      <span className="text-xs">
                        Clique em "Enviar" ou arraste uma imagem para começar
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Grid de thumbnails */}
            {loadState === "loaded" && (filteredItems.length > 0 || uploadingPlaceholder) && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {/* Ajuste #2: Placeholder visual de upload no início do grid */}
                {uploadingPlaceholder && (
                  <UploadingThumbnail placeholder={uploadingPlaceholder} />
                )}

                {filteredItems.map((item) => (
                  <MediaThumbnail
                    key={item.id}
                    item={item}
                    isSelected={isMultiple ? selectedIds.includes(item.id) : selectedId === item.id}
                    isMultiple={isMultiple}
                    onClick={() => isMultiple ? toggleSelectItem(item.id) : selectItem(item.id)}
                    onDoubleClick={!isMultiple ? () => {
                      selectItem(item.id);
                      // Busca o item diretamente — evita depender do estado que
                      // ainda não atualizou neste mesmo tick
                      const target = items.find((i) => i.id === item.id);
                      if (target) onSelect(target);
                    } : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Painel lateral de detalhes (ajuste #5: 280px+) ── */}
          {selectedItem && (
            <MediaDetailPanel
              item={selectedItem}
              onConfirm={handleConfirmSelect}
              onDelete={() => handleDelete(selectedItem.id, selectedItem.name)}
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <span className="text-xs text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? "mídia" : "mídias"}
            {filters.search && ` (filtrado)`}
            {isMultiple && selectionCount > 0 && (
              <span className="ml-2 font-medium text-primary">
                · {selectionCount} {selectionCount === 1 ? "selecionada" : "selecionadas"}
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="rounded-lg border border-input px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmSelect}
              disabled={!hasSelection}
              className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              {isMultiple && selectionCount > 0
                ? `Selecionar (${selectionCount})`
                : "Selecionar"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// UploadingThumbnail — Placeholder durante upload
// ──────────────────────────────────────────────

interface UploadingThumbnailProps {
  placeholder: UploadingPlaceholder;
}

function UploadingThumbnail({ placeholder }: UploadingThumbnailProps) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-primary/50 bg-muted/50">
      {/* Preview local com overlay */}
      <img
        src={placeholder.previewUrl}
        alt={placeholder.name}
        className="h-full w-full object-cover opacity-50"
      />

      {/* Overlay de progresso */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="px-2 text-center text-[10px] font-medium text-primary">
          {placeholder.progress}
        </span>
      </div>

      {/* Nome */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
        <span className="block truncate text-xs text-white">{placeholder.name}</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MediaThumbnail — Card individual na grid (memoizado)
// ──────────────────────────────────────────────
// Ajuste #4: memo() evita re-render quando outros items mudam

interface MediaThumbnailProps {
  item: MediaItem;
  isSelected: boolean;
  isMultiple?: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
}

const MediaThumbnail = memo(function MediaThumbnail({
  item,
  isSelected,
  isMultiple = false,
  onClick,
  onDoubleClick,
}: MediaThumbnailProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-transparent hover:border-border"
      }`}
      title={item.name}
    >
      {/* Imagem */}
      {!imgError ? (
        <img
          src={item.paths.thumbnail}
          alt={item.alt || item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <FileImage className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}

      {/* Overlay de seleção: checkbox (multiple) ou circle (single) */}
      {isMultiple ? (
        <div className={`absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-white/80 bg-black/30 text-transparent group-hover:border-white"
        }`}>
          {isSelected && <Check className="h-3 w-3" />}
        </div>
      ) : (
        isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <Check className="h-4 w-4" />
            </div>
          </div>
        )
      )}

      {/* Nome no hover */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="block truncate text-xs text-white">{item.name}</span>
      </div>
    </button>
  );
});

// ──────────────────────────────────────────────
// MediaDetailPanel — Painel lateral com detalhes
// Ajuste #5: largura aumentada para 280px (w-[280px])
// ──────────────────────────────────────────────

interface MediaDetailPanelProps {
  item: MediaItem;
  onConfirm: () => void;
  onDelete: () => void;
}

function MediaDetailPanel({ item, onConfirm, onDelete }: MediaDetailPanelProps) {
  const [previewError, setPreviewError] = useState(false);

  // ── Edição de alt ──
  const savedAlt = getMediaAltOverride(item.id) ?? item.alt ?? "";
  const [altValue, setAltValue] = useState(savedAlt);
  const [altSaving, setAltSaving] = useState(false);
  const [altSaved, setAltSaved] = useState(false);

  // Sincroniza quando item muda
  const handleAltSave = async () => {
    setAltSaving(true);
    try {
      await updateMediaAlt(item.id, altValue.trim());
      setAltSaved(true);
      toast.success("Texto alternativo salvo");
      setTimeout(() => setAltSaved(false), 2000);
    } catch {
      toast.error("Não foi possível salvar o alt");
    } finally {
      setAltSaving(false);
    }
  };

  return (
    <div className="flex w-[300px] flex-shrink-0 flex-col border-l border-border bg-card">
      {/* Preview */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {!previewError ? (
          <img
            src={item.paths.medium}
            alt={altValue || item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
            onError={() => setPreviewError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileImage className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Detalhes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="truncate text-sm font-semibold text-foreground" title={item.name}>
          {item.name}
        </h3>

        <div className="space-y-2 text-xs text-muted-foreground">
          <DetailRow icon={Calendar}  label="Data"      value={formatDate(item.uploadedAt)} />
          <DetailRow icon={Maximize2} label="Dimensões" value={`${item.width} × ${item.height}px`} />
          <DetailRow icon={HardDrive} label="Tamanho"   value={formatFileSize(item.size)} />
          <DetailRow icon={FileImage} label="Tipo"      value={item.mimeType} />
        </div>

        {/* ── Uso da imagem ── */}
        <MediaUsageSection item={item} />

        {/* ── Edição de Alt ── */}
        <div className="border-t border-border pt-3">
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Pencil className="h-3 w-3 text-primary" />
            Texto alternativo (alt)
          </label>
          <p className="mb-2 text-[10px] text-muted-foreground leading-relaxed">
            Descreva a imagem com a keyword principal. Usado em acessibilidade e indexação de imagens no Google.
          </p>
          <textarea
            value={altValue}
            onChange={(e) => setAltValue(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Ex: Furadeira de impacto STIHL 600W em uso em obra"
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{altValue.length}/200</span>
            <button
              onClick={handleAltSave}
              disabled={altSaving}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {altSaved ? (
                <><Check className="h-3 w-3" /> Salvo</>
              ) : altSaving ? (
                "Salvando..."
              ) : (
                <><Save className="h-3 w-3" /> Salvar alt</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 border-t border-border p-3">
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          title="Remover mídia"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remover
        </button>
        <button
          onClick={onConfirm}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition-opacity hover:opacity-90"
        >
          <Check className="h-3.5 w-3.5" />
          Usar esta imagem
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MediaFilterBar — Barra de filtros e ordenação
// ──────────────────────────────────────────────

interface MediaFilterBarProps {
  activeSourceType?: MediaSourceType;
  activeSearch?: string;
  activeSortBy: MediaSortBy;
  onSourceTypeChange: (value: string) => void;
  onSortByChange: (value: MediaSortBy) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

function MediaFilterBar({
  activeSourceType,
  activeSearch,
  activeSortBy,
  onSourceTypeChange,
  onSortByChange,
  onClearFilters,
  totalCount,
  filteredCount,
}: MediaFilterBarProps) {
  const hasActiveFilter = !!activeSourceType || !!activeSearch;
  const isFiltered = filteredCount !== totalCount;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-2.5">
      {/* Origem */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Origem:</span>
        <div className="flex gap-1">
          {SOURCE_TYPE_OPTIONS.map((opt) => {
            const isActive =
              opt.value === "all" ? !activeSourceType : activeSourceType === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onSourceTypeChange(opt.value)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Separador visual */}
      <div className="h-5 w-px bg-border" />

      {/* Ordenação */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Ordenar:</span>
        <select
          value={activeSortBy}
          onChange={(e) => onSortByChange(e.target.value as MediaSortBy)}
          className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Indicação de filtro ativo + botão limpar */}
      {hasActiveFilter && (
        <>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            {/* Badge com contagem */}
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {isFiltered
                ? `${filteredCount} de ${totalCount}`
                : `${totalCount} mídias`}
            </span>
            {/* Botão limpar */}
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// DetailRow — Linha de detalhe com ícone
// ──────────────────────────────────────────────

interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
      <span className="flex-shrink-0">{label}:</span>
      <span className="truncate text-foreground">{value}</span>
    </div>
  );
}
