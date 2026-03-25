// ──────────────────────────────────────────────
// UploadDropzone — Componente reutilizável de drag & drop
// ──────────────────────────────────────────────
// Zona de arraste/clique para upload de arquivos.
// Pode ser usado standalone ou dentro de outros componentes.
//
// Features:
//  - Drag & drop com counter para evitar flicker
//  - Clique para abrir file picker
//  - Validação de arquivo (tipo, tamanho)
//  - Preview local opcional
//  - Estado de uploading com progresso
// ──────────────────────────────────────────────

import { memo, useCallback, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { validateMediaFile, ACCEPTED_EXTENSIONS } from "@/data/mediaTypes";

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

interface UploadDropzoneProps {
  /** Callback com o File selecionado (validação já feita) */
  onFileSelected: (file: File) => void | Promise<void>;
  /** Se está fazendo upload no momento */
  uploading?: boolean;
  /** Texto de progresso durante upload */
  uploadProgress?: string;
  /** Label do estado default */
  label?: string;
  /** Sublabel do estado default */
  sublabel?: string;
  /** Label durante drag */
  dragLabel?: string;
  /** Classe CSS adicional no container */
  className?: string;
  /** Desabilita interação */
  disabled?: boolean;
  /** Accept string para o input file (default: ACCEPTED_EXTENSIONS) */
  accept?: string;
}

// ──────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────

const UploadDropzone = memo(function UploadDropzone({
  onFileSelected,
  uploading = false,
  uploadProgress,
  label = "Arraste uma imagem ou clique para enviar",
  sublabel = "JPG, PNG, WebP ou GIF — máx. 10 MB",
  dragLabel = "Solte o arquivo aqui",
  className = "",
  disabled = false,
  accept = ACCEPTED_EXTENSIONS,
}: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
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
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(e.target.files?.[0]);
      // Reset para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFile]
  );

  const isDisabled = disabled || uploading;

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
        isDragging
          ? "border-primary bg-primary/5 text-primary"
          : isDisabled
            ? "cursor-not-allowed border-input/50 text-muted-foreground/50"
            : "cursor-pointer border-input text-muted-foreground hover:border-primary hover:text-primary"
      } ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={isDisabled}
      />

      {uploading ? (
        <>
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="text-sm font-medium text-primary">
            {uploadProgress || "Enviando..."}
          </span>
        </>
      ) : isDragging ? (
        <>
          <Upload className="h-7 w-7" />
          <span className="text-sm font-medium">{dragLabel}</span>
        </>
      ) : (
        <>
          <Upload className="h-7 w-7" />
          <span className="text-sm">{label}</span>
          <span className="text-xs opacity-60">{sublabel}</span>
        </>
      )}
    </div>
  );
});

export default UploadDropzone;
