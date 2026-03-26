// ──────────────────────────────────────────────
// MediaField — Wrapper leve (hook + UI)
// ──────────────────────────────────────────────
// Combina useMediaField + MediaFieldUI em um único
// componente para uso direto em formulários.
//
// Para controle granular, use useMediaField + MediaFieldUI
// separadamente.
//
// Uso:
//   <MediaField
//     value={form.image}
//     onChange={(url) => updateField("image", url)}
//     label="Imagem Destacada"
//   />
// ──────────────────────────────────────────────

import { useMediaField } from "@/hooks/useMediaField";
import type { UseMediaFieldOptions } from "@/hooks/useMediaField";
import MediaFieldUI from "./MediaFieldUI";

interface MediaFieldProps {
  value: string | string[];
  onChange: (url: string | string[]) => void;
  mode?: "single" | "multiple";
  sourceType?: "post" | "page" | "standalone";
  sourceId?: string;
  title?: string;
  maxItems?: number;
  label?: string;
  className?: string;
}

export default function MediaField({ label, className, ...options }: MediaFieldProps) {
  const field = useMediaField(options as any as UseMediaFieldOptions);
  return <MediaFieldUI {...field} label={label} className={className} />;
}
