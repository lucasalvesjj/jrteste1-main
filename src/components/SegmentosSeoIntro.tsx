import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEGMENTOS_SEO_TEXT_HTML } from "@/data/segmentosSeoText";

const SegmentosSeoIntro = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mx-auto mb-4 max-w-3xl pt-4 text-center">
      {expanded && (
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={true}
          aria-controls="segmentos-seo-content"
          className="mb-1 gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground"
          onClick={() => setExpanded(false)}
        >
          <ChevronUp className="h-3 w-3" />
          Mostrar menos
        </Button>
      )}

      <div className="relative">
        <div
          id="segmentos-seo-content"
          className={`prose prose-sm max-w-none text-muted-foreground/80
            prose-headings:font-heading prose-headings:text-foreground/60 prose-headings:font-semibold
            prose-h2:text-sm prose-h3:text-xs prose-h4:text-xs
            prose-p:text-xs prose-p:leading-relaxed
            [&_h2]:text-center [&_h3]:text-center [&_h4]:text-center [&_p]:text-center
            overflow-hidden transition-all duration-300
            ${expanded ? "" : "max-h-[4.5rem]"}`}
          dangerouslySetInnerHTML={{ __html: SEGMENTOS_SEO_TEXT_HTML }}
        />

        {!expanded && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent"
          />
        )}
      </div>

      {!expanded && (
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={false}
          aria-controls="segmentos-seo-content"
          className="mt-1 gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground"
          onClick={() => setExpanded(true)}
        >
          <ChevronDown className="h-3 w-3" />
          Mostrar tudo
        </Button>
      )}
    </div>
  );
};

export default SegmentosSeoIntro;
