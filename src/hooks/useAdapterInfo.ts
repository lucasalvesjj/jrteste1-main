// ──────────────────────────────────────────────
// useAdapterInfo — Expõe informações do adapter de mídia ativo
// ──────────────────────────────────────────────
// Resolve o adapter uma vez e expõe flags úteis para a UI:
//   - isManual: true quando manualAdapter está ativo (produção estática)
//   - adapterName: nome legível do adapter
//   - supportsAutoUpload: se o upload é automático ou gera downloads
//
// Uso:
//   const { isManual, supportsAutoUpload } = useAdapterInfo();
// ──────────────────────────────────────────────

import { useEffect, useState } from "react";
import { getActiveAdapter, initMediaApi } from "@/lib/mediaApi";

export interface AdapterInfo {
  isManual: boolean;
  adapterName: string;
  supportsAutoUpload: boolean;
  ready: boolean;
}

const DEFAULT_INFO: AdapterInfo = {
  isManual: false,
  adapterName: "",
  supportsAutoUpload: true,
  ready: false,
};

export function useAdapterInfo(): AdapterInfo {
  const [info, setInfo] = useState<AdapterInfo>(DEFAULT_INFO);

  useEffect(() => {
    // Se o adapter já foi resolvido, usa direto (sem await)
    const existing = getActiveAdapter();
    if (existing) {
      setInfo({
        isManual: existing.name === "manual",
        adapterName: existing.name,
        supportsAutoUpload: existing.supportsAutoUpload,
        ready: true,
      });
      return;
    }

    // Caso contrário, inicializa e aguarda
    initMediaApi().then(() => {
      const adapter = getActiveAdapter();
      if (!adapter) return;
      setInfo({
        isManual: adapter.name === "manual",
        adapterName: adapter.name,
        supportsAutoUpload: adapter.supportsAutoUpload,
        ready: true,
      });
    });
  }, []);

  return info;
}
