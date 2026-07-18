import { z } from "zod";

export const propertyTypes = [
  "EINFAMILIENHAUS",
  "MEHRFAMILIENHAUS",
  "EIGENTUMSWOHNUNG",
  "GRUNDSTUECK",
  "GEWERBE",
  "SONSTIGES",
] as const;

export const leadStatuses = [
  "NEU",
  "KONTAKTIERT",
  "IN_GESPRAECH",
  "TERMIN",
  "QUALIFIZIERT",
  "GEWONNEN",
  "VERLOREN",
] as const;

export const leadSources = [
  "MANUAL",
  "CSV_IMPORT",
  "PASTE_PARSER",
  "IMMOSCOUT24_API",
  "PUBLIC_REGISTER",
] as const;

export const leadInputSchema = z.object({
  name: z.string().trim().min(1).optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  propertyType: z.enum(propertyTypes).optional(),
  livingArea: z.coerce.number().positive().optional().nullable(),
  plotArea: z.coerce.number().positive().optional().nullable(),
  rooms: z.coerce.number().positive().optional().nullable(),
  buildYear: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  askingPrice: z.coerce.number().positive().optional().nullable(),
  source: z.enum(leadSources).optional(),
  sourceUrl: z.string().trim().optional().or(z.literal("")),
  situation: z.string().trim().optional().or(z.literal("")),
  status: z.enum(leadStatuses).optional(),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
