// ──────────────────────────────────────────────
// MediaUsageSection — Seção "Onde é usada" no painel de detalhes
// ──────────────────────────────────────────────
// Exibe onde a imagem selecionada está sendo usada,
// com base em sourceType/sourceId do MediaItem.
//
// Estados visuais:
//  - post       → badge verde + título do post
//  - page       → badge azul + nome da página
//  - standalone → badge cinza + "Imagem avulsa"
//  - unused     → badge amarelo + "Sem uso detectado"
// ──────────────────────────────────────────────

import { FileText, Globe, Image, AlertCircle, ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { useBlogStore } from "@/stores/blogStore";
import { getMediaUsage, buildPostTitleMap } from "@/lib/mediaUsage";
import type { MediaItem } from "@/data/mediaTypes";
import type { MediaUsageStatus } from "@/lib/mediaUsage";

// ──────────────────────────────────────────────
// Config visual por status
// ──────────────────────────────────────────────

const STATUS_CONFIG: Record<
  MediaUsageStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    label: string;
  }
> = {
  post: {
    icon: FileText,
    badgeClass: "bg-green-500/15 text-green-400 border border-green-500/25",
    label: "Post",
  },
  page: {
    icon: Globe,
    badgeClass: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
    label: "Página",
  },
  standalone: {
    icon: Image,
    badgeClass: "bg-muted text-muted-foreground border border-border",
    label: "Avulsa",
  },
  unused: {
    icon: AlertCircle,
    badgeClass: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25",
    label: "Sem uso",
  },
};

// ──────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────

interface MediaUsageSectionProps {
  item: MediaItem;
}

export function MediaUsageSection({ item }: MediaUsageSectionProps) {
  const posts = useBlogStore((s) => s.posts);

  const usage = useMemo(() => {
    const titleMap = buildPostTitleMap(posts);
    return getMediaUsage(item, titleMap);
  }, [item.id, item.sourceType, item.sourceId, posts]);

  const config = STATUS_CONFIG[usage.status];
  const Icon = config.icon;

  return (
    <div className="border-t border-border pt-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Uso
      </p>

      <div className="flex items-start gap-2">
        {/* Badge de tipo */}
        <span
          className={`mt-0.5 inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.badgeClass}`}
        >
          <Icon className="h-2.5 w-2.5" />
          {config.label}
        </span>

        {/* Rótulo da origem — clicável se post com link */}
        {usage.status === "post" && usage.link ? (
          <a
            href={usage.link}
            title={`Editar post: ${usage.label}`}
            className="inline-flex items-center gap-1 text-xs leading-relaxed text-primary underline-offset-2 hover:underline"
          >
            <span className="truncate max-w-[160px]">{usage.label}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
          </a>
        ) : (
          <span
            className="text-xs leading-relaxed text-foreground"
            title={usage.label}
          >
            {usage.label}
          </span>
        )}
      </div>
    </div>
  );
}
