// ──────────────────────────────────────────────
// ManualAdapterBanner — Aviso visual quando manualAdapter está ativo
// ──────────────────────────────────────────────
// Exibido no topo de AdminMedia e AdminPostEditor quando
// o adapter de produção estática está ativo.
// Explica ao usuário o que acontece no upload e o que fazer.
// ──────────────────────────────────────────────

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface ManualAdapterBannerProps {
  context?: "media" | "editor";
}

export default function ManualAdapterBanner({ context = "media" }: ManualAdapterBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-orange/40 bg-brand-orange/10 px-4 py-3 text-sm text-foreground">
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-orange" />

      <div className="flex-1 space-y-1">
        <p className="font-semibold text-foreground">
          Modo produção estática — uploads geram downloads locais
        </p>

        {context === "editor" ? (
          <p className="text-foreground/80">
            Ao arrastar ou colar imagens no editor, 4 arquivos serão baixados
            (thumbnail, medium, large, original). Copie-os para{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              public/media/{"{ano}"}/{"{mes}"}/{"{id}"}/
            </code>{" "}
            e atualize o catálogo{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              /data/media-library.json
            </code>{" "}
            antes de publicar.
          </p>
        ) : (
          <p className="text-foreground/80">
            Ao enviar uma imagem, 4 arquivos serão baixados para o seu computador
            (thumbnail.webp, medium.webp, large.webp, original). Copie-os para{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">public/media/</code> e
            atualize o catálogo{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              /data/media-library.json
            </code>
            .
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Em desenvolvimento local com{" "}
          <code className="rounded bg-muted px-1 font-mono">bun dev</code> ou{" "}
          <code className="rounded bg-muted px-1 font-mono">npm run dev</code>, o upload
          automático funciona se o Sharp estiver instalado. Verifique o console do servidor.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="ml-2 flex-shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Fechar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
