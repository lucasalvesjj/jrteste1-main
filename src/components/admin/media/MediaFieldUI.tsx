// ──────────────────────────────────────────────
// MediaFieldUI — Componente de apresentação para campo de mídia
// ──────────────────────────────────────────────
// Renderiza preview(s), botões de ação e o modal.
// Recebe toda a lógica pronta do useMediaField.
// Não tem estado próprio — é puro presentational.
// ──────────────────────────────────────────────

import { Suspense, lazy, useState } from "react";
import { FolderOpen, ImageIcon, Trash2, X } from "lucide-react";
import type { UseMediaFieldReturn } from "@/hooks/useMediaField";

const MediaLibrary = lazy(() => import("./MediaLibrary"));

interface MediaFieldUIProps extends UseMediaFieldReturn {
  /** Label do campo */
  label?: string;
  /** Classe CSS adicional no container */
  className?: string;
}

const MediaLibraryFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-3 text-sm text-muted-foreground shadow-lg">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Carregando biblioteca...
    </div>
  </div>
);

/** Thumbnail com botão de remover */
function PreviewThumb({
  url,
  onRemove,
}: {
  url: string;
  onRemove: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border">
      {!imgError ? (
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 rounded-md bg-background/80 p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-background"
        title="Remover imagem"
      >
        <X className="h-3.5 w-3.5 text-destructive" />
      </button>
    </div>
  );
}

export default function MediaFieldUI({
  urls,
  hasValue,
  mode,
  maxItems,
  isAtLimit,
  openLibrary,
  removeAt,
  removeAll,
  modalProps,
  label,
  className = "",
}: MediaFieldUIProps) {
  const isSingle = mode === "single";

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {/* ── Estado com imagem(ns) ── */}
      {hasValue && (
        <div>
          {isSingle ? (
            /* Single: preview grande */
            <div className="relative h-48 overflow-hidden rounded-lg border border-border">
              <PreviewThumb url={urls[0]} onRemove={() => removeAt(0)} />
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button
                  type="button"
                  onClick={openLibrary}
                  className="rounded-lg bg-background/80 px-2.5 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-background"
                  title="Trocar imagem"
                >
                  <FolderOpen className="mr-1 inline h-3.5 w-3.5" />
                  Trocar
                </button>
              </div>
            </div>
          ) : (
            /* Multiple: grid de thumbnails */
            <div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                {urls.map((url, index) => (
                  <div key={`${url}-${index}`} className="aspect-square">
                    <PreviewThumb url={url} onRemove={() => removeAt(index)} />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {!isAtLimit && (
                  <button
                    type="button"
                    onClick={openLibrary}
                    className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    Adicionar
                  </button>
                )}
                <button
                  type="button"
                  onClick={removeAll}
                  className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover todas
                </button>
                {maxItems < Infinity && (
                  <span className="text-xs text-muted-foreground">
                    {urls.length}/{maxItems}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Estado vazio ── */}
      {!hasValue && (
        <button
          type="button"
          onClick={openLibrary}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <FolderOpen className="h-7 w-7" />
          <span className="text-sm">
            {isSingle ? "Escolher imagem" : "Escolher imagens"}
          </span>
        </button>
      )}

      {/* ── Modal da Media Library ── */}
      <Suspense fallback={<MediaLibraryFallback />}>
        <MediaLibrary {...modalProps} />
      </Suspense>
    </div>
  );
}
