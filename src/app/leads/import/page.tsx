"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ImportResult = { imported: number; total: number; failed: { row: number }[] };

export default function ImportPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/leads/import", { method: "POST", body: formData });
    setLoading(false);

    if (!res.ok) {
      setError("Import fehlgeschlagen. Bitte Datei prüfen.");
      return;
    }

    const data = await res.json();
    setResult(data);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-lg font-semibold">CSV-Import</h1>
        <p className="text-sm text-neutral-500">
          Importiere Leads aus einer bestehenden Liste (z.B. Export aus Excel). Lade dir die{" "}
          <a href="/leadflow-import-vorlage.csv" className="underline" download>
            Vorlage
          </a>{" "}
          herunter und passe sie an.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            required
            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm dark:file:bg-neutral-800"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Importiere..." : "Importieren"}
          </Button>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result && (
          <div className="rounded-md border border-neutral-200 p-4 text-sm dark:border-neutral-800">
            <p>
              <strong>{result.imported}</strong> von {result.total} Zeilen importiert.
            </p>
            {result.failed.length > 0 && (
              <p className="mt-1 text-amber-600">
                Fehler in Zeile(n): {result.failed.map((f) => f.row).join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="text-xs text-neutral-500">
          Unterstützte Spalten: name, telefon, email, adresse, plz, ort, objekttyp, wohnflaeche,
          grundstuecksflaeche, zimmer, baujahr, preis, situation, quelle_url. Groß-/Kleinschreibung wird ignoriert,
          unbekannte Spalten werden übersprungen.
        </div>
      </CardContent>
    </Card>
  );
}
