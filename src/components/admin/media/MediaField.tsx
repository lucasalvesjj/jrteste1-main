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

interface MediaFieldProps extends UseMediaFieldOptions {
  /** Label do campo */
  label?: string;
  /** Classe CSS adicional */
  className?: string;
}

export default function MediaField({ label, className, ...options }: MediaFieldProps) {
  const field = useMediaField(options);
  return <MediaFieldUI {...field} label={label} className={className} />;
}
