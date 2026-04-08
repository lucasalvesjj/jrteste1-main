// Tipos compartilhados de Tracking Codes
// Extraídos de AdminSeoEditor para evitar dependência público → admin

export type TrackingPosition = "head" | "body_start" | "body_end";
export type TrackingScope    = "global" | "specific";

export interface TrackingCode {
  id: string;
  name: string;
  code: string;
  position: TrackingPosition;
  scope: TrackingScope;
  includedPaths: string[];
  excludedPaths: string[];
  enabled: boolean;
  order: number;
}

export const TRACKING_STORAGE_KEY = "comercial-jr-tracking-codes";
