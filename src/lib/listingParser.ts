/**
 * Extrahiert strukturierte Felder aus Text, den der Nutzer manuell aus einem
 * Inserat kopiert hat (z.B. eBay Kleinanzeigen, ImmoScout24). Es wird bewusst
 * NICHT automatisiert von Portalen gescraped — der Nutzer sieht sich das
 * Inserat selbst an und fügt Titel/Beschreibung hier ein.
 */

export type ParsedListing = {
  askingPrice?: number;
  livingArea?: number;
  plotArea?: number;
  rooms?: number;
  postalCode?: string;
  city?: string;
  buildYear?: number;
  situation: string;
};

function toNumber(raw: string): number {
  return parseFloat(raw.replace(/\./g, "").replace(",", "."));
}

export function parseListingText(raw: string): ParsedListing {
  const text = raw.trim();

  const priceMatch = text.match(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s*(?:€|eur)/i);
  const areaMatch = text.match(/(\d{1,4}(?:,\d+)?)\s*m²\s*(?:wohnfläche)?/i);
  const plotMatch = text.match(/(\d{1,6}(?:,\d+)?)\s*m²\s*(?:grundstück|grundstücksfläche)/i);
  const roomsMatch = text.match(/(\d+(?:[.,]\d+)?)\s*zimmer/i);
  const plzCityMatch = text.match(/\b(\d{5})\s+([A-ZÄÖÜ][a-zäöüß-]+(?:\s[A-ZÄÖÜ][a-zäöüß-]+)*)/);
  const yearMatch = text.match(/(?:baujahr|erbaut)\s*:?\s*(\d{4})/i);

  return {
    askingPrice: priceMatch ? toNumber(priceMatch[1]) : undefined,
    livingArea: areaMatch ? toNumber(areaMatch[1]) : undefined,
    plotArea: plotMatch ? toNumber(plotMatch[1]) : undefined,
    rooms: roomsMatch ? toNumber(roomsMatch[1]) : undefined,
    postalCode: plzCityMatch ? plzCityMatch[1] : undefined,
    city: plzCityMatch ? plzCityMatch[2] : undefined,
    buildYear: yearMatch ? parseInt(yearMatch[1], 10) : undefined,
    situation: text,
  };
}
