import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TocHeading } from "@/lib/headingIds";

interface TableOfContentsProps {
  headings: TocHeading[];
}

const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
  e.preventDefault();
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
};

const TocList = ({ headings }: { headings: TocHeading[] }) => (
  <ol className="space-y-1.5 text-sm">
    {headings.map((h) => (
      <li
        key={h.id}
        className={cn("leading-snug", h.level === 3 && "ml-4")}
      >
        <a
          href={`#${h.id}`}
          onClick={(e) => handleClick(e, h.id)}
          className={cn(
            "text-foreground/70 transition-colors hover:text-primary",
            h.level === 2 && "font-semibold text-foreground/90"
          )}
        >
          {h.text}
        </a>
      </li>
    ))}
  </ol>
);

/**
 * Sumário automático gerado a partir dos headings H2/H3 do post.
 *
 * Modos de renderização:
 *  - 0 headings → null (bloco totalmente oculto)
 *  - 1–3 headings → lista completa sem colapso
 *  - ≥4 headings → mostra apenas os 3 primeiros com degradê + botão "Mostrar tudo"
 */
const COLLAPSED_COUNT = 3;

const TableOfContents = ({ headings }: TableOfContentsProps) => {
  const [expanded, setExpanded] = useState(false);

  if (headings.length === 0) return null;

  const isCollapsible = headings.length > COLLAPSED_COUNT;
  const visibleHeadings =
    isCollapsible && !expanded ? headings.slice(0, COLLAPSED_COUNT) : headings;

  return (
    <nav
      aria-label="Sumário"
      className="relative my-8 rounded-lg border border-border bg-muted/40 p-4 md:p-6 md:w-fit"
    >
      <p className="mb-3 font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Neste artigo
      </p>

      {isCollapsible ? (
        <>
          <div id="toc-content" className="relative">
            <TocList headings={visibleHeadings} />

            {/* Degradê suave no último item da lista colapsada */}
            {!expanded && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/95 to-transparent"
              />
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            aria-expanded={expanded}
            aria-controls="toc-content"
            className="mt-2 gap-1.5 text-xs"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Mostrar tudo
              </>
            )}
          </Button>
        </>
      ) : (
        // 1 a 3 headings: exibe completo, sem colapso, sem degradê, sem botão
        <TocList headings={headings} />
      )}
    </nav>
  );
};

export default TableOfContents;
