import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold">Datenquellen & Connectoren</h1>
          <p className="text-sm text-neutral-500">
            Übersicht, welche Quellen aktuell angebunden sind und was für weitere Automatisierung nötig ist.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
          <SourceRow
            title="Manuelle Erfassung"
            status="aktiv"
            description="Leads direkt im Formular anlegen."
          />
          <SourceRow
            title="CSV-Import"
            status="aktiv"
            description="Bestehende Listen (Excel/CRM-Export) importieren."
          />
          <SourceRow
            title="Inserat einfügen (Copy & Paste)"
            status="aktiv"
            description="Text aus einem selbst geöffneten Inserat einfügen und automatisch strukturieren lassen — ohne automatisierten Zugriff auf das Portal."
          />
          <SourceRow
            title="ImmoScout24 Partner-API"
            status="benötigt Zugangsdaten"
            description="Erfordert einen Partnervertrag mit ImmoScout24 und OAuth-Zugangsdaten (Client-ID/Secret). Sobald vorhanden, in .env als IS24_CLIENT_ID / IS24_CLIENT_SECRET hinterlegen — die Anbindung kann dann als Connector ergänzt werden."
          />
          <SourceRow
            title="Öffentliche Register (Grundbuch, Nachlassgericht etc.)"
            status="rechtlich zu prüfen"
            description="Zugriff ist je nach Bundesland unterschiedlich geregelt und erfordert i.d.R. ein berechtigtes Interesse (z.B. §12 GBO). Kein pauschaler, automatisierter Massenzugriff möglich."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Rechtliche Hinweise</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          <p>
            Viele große Immobilienportale (z.B. ImmoScout24, eBay Kleinanzeigen) untersagen in ihren AGB das
            automatisierte Auslesen (Scraping) von Inseraten. Ein Verstoß kann zu Accountsperren oder
            Unterlassungsansprüchen führen. LeadFlow enthält deshalb bewusst keinen Scraper für diese Portale.
          </p>
          <p>
            Nutze stattdessen offizielle Schnittstellen (z.B. Partner-APIs), eigene Kontaktlisten/CSV-Importe oder
            die &quot;Inserat einfügen&quot;-Funktion, bei der du selbst im Browser das Inserat öffnest und den Text
            kopierst.
          </p>
          <p>
            Beachte außerdem die DSGVO bei der Speicherung personenbezogener Daten (Name, Telefon, E-Mail,
            Adresse): Erhebe nur Daten mit einer Rechtsgrundlage (z.B. berechtigtes Interesse bei öffentlich
            einsehbaren Verkaufsinseraten) und lösche Leads, die dauerhaft nicht mehr relevant sind.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SourceRow({ title, status, description }: { title: string; status: string; description: string }) {
  const color = status === "aktiv" ? "green" : status === "rechtlich zu prüfen" ? "red" : "amber";
  return (
    <div className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{title}</span>
        <Badge color={color}>{status}</Badge>
      </div>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  );
}
