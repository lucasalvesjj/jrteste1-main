// ──────────────────────────────────────────────
// ManualAdapterBanner — Aviso quando upload automático não está disponível
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

      <div className="flex-1 space-y-1.5">
        <>
          <p className="font-semibold text-foreground">
            Modo produção estática — uploads geram downloads locais
          </p>
          {context === "editor" ? (
            <p className="text-foreground/80">
              Ao arrastar ou colar imagens no editor, 4 arquivos serão baixados. Copie-os para{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">public/media/</code> e
              atualize o catálogo{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">/data/media-library.json</code>.
            </p>
          ) : (
            <p className="text-foreground/80">
              Ao enviar uma imagem, 4 arquivos serão baixados. Copie-os para{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">public/media/</code> e
              atualize o catálogo{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">/data/media-library.json</code>.
            </p>
          )}
        </>
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
