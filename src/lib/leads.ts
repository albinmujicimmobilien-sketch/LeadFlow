import type { LeadInput } from "@/lib/validation";
import { scoreLead } from "@/lib/scoring";

function clean(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildLeadData(input: LeadInput) {
  const situation = clean(input.situation);
  const { score, tags } = scoreLead(situation);

  return {
    name: clean(input.name),
    phone: clean(input.phone),
    email: clean(input.email),
    address: clean(input.address),
    postalCode: clean(input.postalCode),
    city: clean(input.city),
    propertyType: input.propertyType ?? "SONSTIGES",
    livingArea: input.livingArea ?? null,
    plotArea: input.plotArea ?? null,
    rooms: input.rooms ?? null,
    buildYear: input.buildYear ?? null,
    askingPrice: input.askingPrice ?? null,
    source: input.source ?? "MANUAL",
    sourceUrl: clean(input.sourceUrl),
    situation,
    motivationTags: JSON.stringify(tags),
    score,
    status: input.status ?? "NEU",
  };
}
