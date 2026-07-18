"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Textarea, Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { scoreColor } from "@/lib/labels";
import type { ParsedListing } from "@/lib/listingParser";

export default function QuickAddPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [listing, setListing] = useState<ParsedListing | null>(null);
  const [preview, setPreview] = useState<{ score: number; tags: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleParse() {
    if (!text.trim()) return;
    const res = await fetch("/api/leads/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setListing(data.listing);
    setPreview(data.preview);
  }

  async function handleSave() {
    if (!listing) return;
    setSaving(true);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...listing,
        sourceUrl,
        source: "PASTE_PARSER",
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/leads/${data.lead.id}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-lg font-semibold">Inserat einfügen</h1>
        <p className="text-sm text-neutral-500">
          Öffne ein Inserat (z.B. eBay Kleinanzeigen, ImmoScout24) selbst im Browser, kopiere Titel und
          Beschreibungstext und füge sie hier ein. LeadFlow ruft die Portale <strong>nicht automatisiert</strong>{" "}
          ab — so bleibst du auf der sicheren Seite bei den jeweiligen Nutzungsbedingungen.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <Label>Link zum Inserat (optional)</Label>
          <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <Label>Inseratstext</Label>
          <Textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Titel + Beschreibung aus dem Inserat hier einfügen..."
          />
        </div>
        <div>
          <Button type="button" variant="secondary" onClick={handleParse}>
            Analysieren
          </Button>
        </div>

        {listing && preview && (
          <div className="flex flex-col gap-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color={scoreColor(preview.score)}>Score: {preview.score}</Badge>
              {preview.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <Field label="PLZ / Ort" value={[listing.postalCode, listing.city].filter(Boolean).join(" ")} />
              <Field label="Preis" value={listing.askingPrice ? `${listing.askingPrice.toLocaleString("de-DE")} €` : undefined} />
              <Field label="Wohnfläche" value={listing.livingArea ? `${listing.livingArea} m²` : undefined} />
              <Field label="Grundstück" value={listing.plotArea ? `${listing.plotArea} m²` : undefined} />
              <Field label="Zimmer" value={listing.rooms?.toString()} />
              <Field label="Baujahr" value={listing.buildYear?.toString()} />
            </dl>
            <div>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Speichern..." : "Als Lead speichern"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd>{value || "–"}</dd>
    </div>
  );
}
