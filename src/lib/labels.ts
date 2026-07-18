export const STATUS_LABELS: Record<string, string> = {
  NEU: "Neu",
  KONTAKTIERT: "Kontaktiert",
  IN_GESPRAECH: "Im Gespräch",
  TERMIN: "Termin vereinbart",
  QUALIFIZIERT: "Qualifiziert",
  GEWONNEN: "Gewonnen",
  VERLOREN: "Verloren",
};

export const STATUS_COLORS: Record<string, "neutral" | "green" | "amber" | "red" | "blue"> = {
  NEU: "blue",
  KONTAKTIERT: "amber",
  IN_GESPRAECH: "amber",
  TERMIN: "amber",
  QUALIFIZIERT: "green",
  GEWONNEN: "green",
  VERLOREN: "red",
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  EINFAMILIENHAUS: "Einfamilienhaus",
  MEHRFAMILIENHAUS: "Mehrfamilienhaus",
  EIGENTUMSWOHNUNG: "Eigentumswohnung",
  GRUNDSTUECK: "Grundstück",
  GEWERBE: "Gewerbeimmobilie",
  SONSTIGES: "Sonstiges",
};

export const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manuell erfasst",
  CSV_IMPORT: "CSV-Import",
  PASTE_PARSER: "Inserat eingefügt",
  IMMOSCOUT24_API: "ImmoScout24 API",
  PUBLIC_REGISTER: "Öffentliches Register",
};

export function scoreColor(score: number): "neutral" | "green" | "amber" | "red" | "blue" {
  if (score >= 60) return "red";
  if (score >= 30) return "amber";
  if (score > 0) return "blue";
  return "neutral";
}
