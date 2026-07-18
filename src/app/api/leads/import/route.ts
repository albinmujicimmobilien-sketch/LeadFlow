import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { leadInputSchema } from "@/lib/validation";
import { buildLeadData } from "@/lib/leads";

// Erlaubte CSV-Spalten -> Lead-Feld. Unbekannte Spalten werden ignoriert.
const COLUMN_MAP: Record<string, string> = {
  name: "name",
  telefon: "phone",
  phone: "phone",
  email: "email",
  "e-mail": "email",
  adresse: "address",
  address: "address",
  plz: "postalCode",
  postleitzahl: "postalCode",
  stadt: "city",
  ort: "city",
  city: "city",
  objekttyp: "propertyType",
  wohnflaeche: "livingArea",
  wohnfläche: "livingArea",
  grundstuecksflaeche: "plotArea",
  grundstücksfläche: "plotArea",
  zimmer: "rooms",
  baujahr: "buildYear",
  preis: "askingPrice",
  angebotspreis: "askingPrice",
  situation: "situation",
  beschreibung: "situation",
  notiz: "situation",
  quelle_url: "sourceUrl",
  url: "sourceUrl",
};

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine CSV-Datei übermittelt" }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      { error: "CSV konnte nicht gelesen werden", details: parsed.errors },
      { status: 400 },
    );
  }

  let imported = 0;
  const failed: { row: number; error: unknown }[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const mapped: Record<string, string> = {};

    for (const [rawKey, rawValue] of Object.entries(row)) {
      const field = COLUMN_MAP[rawKey.trim().toLowerCase()];
      if (field && rawValue) mapped[field] = rawValue.trim();
    }

    const candidate = leadInputSchema.safeParse({ ...mapped, source: "CSV_IMPORT" });

    if (!candidate.success) {
      failed.push({ row: i + 2, error: candidate.error.flatten() });
      continue;
    }

    await prisma.lead.create({ data: buildLeadData(candidate.data) });
    imported++;
  }

  return NextResponse.json({ imported, failed, total: parsed.data.length });
}
