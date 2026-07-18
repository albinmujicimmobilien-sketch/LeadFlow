"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PROPERTY_TYPE_LABELS, STATUS_LABELS, scoreColor } from "@/lib/labels";

export type LeadFormValues = {
  name: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  propertyType: string;
  livingArea: string;
  plotArea: string;
  rooms: string;
  buildYear: string;
  askingPrice: string;
  sourceUrl: string;
  situation: string;
  status: string;
};

const emptyValues: LeadFormValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  postalCode: "",
  city: "",
  propertyType: "SONSTIGES",
  livingArea: "",
  plotArea: "",
  rooms: "",
  buildYear: "",
  askingPrice: "",
  sourceUrl: "",
  situation: "",
  status: "NEU",
};

export function LeadForm({
  leadId,
  initialValues,
}: {
  leadId?: string;
  initialValues?: Partial<LeadFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<LeadFormValues>({ ...emptyValues, ...initialValues });
  const [preview, setPreview] = useState<{ score: number; tags: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof LeadFormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function checkScore() {
    if (!values.situation.trim()) {
      setPreview(null);
      return;
    }
    const res = await fetch("/api/leads/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: values.situation }),
    });
    if (res.ok) {
      const data = await res.json();
      setPreview(data.preview);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...values,
      livingArea: values.livingArea || undefined,
      plotArea: values.plotArea || undefined,
      rooms: values.rooms || undefined,
      buildYear: values.buildYear || undefined,
      askingPrice: values.askingPrice || undefined,
    };

    const res = await fetch(leadId ? `/api/leads/${leadId}` : "/api/leads", {
      method: leadId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Speichern fehlgeschlagen. Bitte Eingaben prüfen.");
      return;
    }

    const data = await res.json();
    router.push(`/leads/${data.lead.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="col-span-full mb-1 text-sm font-semibold text-neutral-500">Kontakt</legend>
        <div>
          <Label>Name</Label>
          <Input value={values.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <Label>Telefon</Label>
          <Input value={values.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <Label>E-Mail</Label>
          <Input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        {leadId && (
          <div>
            <Label>Status</Label>
            <Select value={values.status} onChange={(e) => set("status", e.target.value)}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="col-span-full mb-1 text-sm font-semibold text-neutral-500">Objekt</legend>
        <div>
          <Label>Adresse</Label>
          <Input value={values.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <Label>PLZ</Label>
          <Input value={values.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
        </div>
        <div>
          <Label>Ort</Label>
          <Input value={values.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <Label>Objekttyp</Label>
          <Select value={values.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Wohnfläche (m²)</Label>
          <Input type="number" value={values.livingArea} onChange={(e) => set("livingArea", e.target.value)} />
        </div>
        <div>
          <Label>Grundstücksfläche (m²)</Label>
          <Input type="number" value={values.plotArea} onChange={(e) => set("plotArea", e.target.value)} />
        </div>
        <div>
          <Label>Zimmer</Label>
          <Input type="number" step="0.5" value={values.rooms} onChange={(e) => set("rooms", e.target.value)} />
        </div>
        <div>
          <Label>Baujahr</Label>
          <Input type="number" value={values.buildYear} onChange={(e) => set("buildYear", e.target.value)} />
        </div>
        <div>
          <Label>Angebotspreis (€)</Label>
          <Input type="number" value={values.askingPrice} onChange={(e) => set("askingPrice", e.target.value)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Label>Quelle / Link zum Inserat</Label>
          <Input value={values.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} placeholder="https://..." />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-neutral-500">Verkaufsanlass / Situation</legend>
        <Textarea
          rows={4}
          value={values.situation}
          onChange={(e) => set("situation", e.target.value)}
          onBlur={checkScore}
          placeholder="z.B. Erbengemeinschaft möchte zügig verkaufen, Haus steht seit Monaten leer..."
        />
        {preview && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-neutral-500">Verkaufsbereitschaft:</span>
            <Badge color={scoreColor(preview.score)}>{preview.score} / 100</Badge>
            {preview.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
            {preview.tags.length === 0 && <span className="text-neutral-400">keine Signalwörter erkannt</span>}
          </div>
        )}
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Speichern..." : leadId ? "Änderungen speichern" : "Lead anlegen"}
        </Button>
      </div>
    </form>
  );
}
