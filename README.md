# LeadFlow

Web-App zur Erfassung, Bewertung und Verwaltung von Leads verkaufsbereiter Immobilien-Eigentümer (Fokus: Deutschland).

## Funktionen

- **Dashboard** mit Kennzahlen, Filter (Status, Score, Suche) und Lead-Tabelle
- **Manuelle Lead-Erfassung** inkl. Objektdaten und Verkaufsanlass
- **CSV-Import** für bestehende Kontaktlisten (Vorlage unter `/leadflow-import-vorlage.csv`)
- **"Inserat einfügen"**: Text aus einem selbst geöffneten Inserat (z.B. eBay Kleinanzeigen, ImmoScout24) einfügen —
  wird automatisch in Objektdaten strukturiert. Es findet **kein automatisiertes Scraping** der Portale statt.
- **Verkaufsbereitschafts-Score (0–100)**: Heuristik, die Freitext auf Signalwörter untersucht (Erbschaft,
  Scheidung, Zwangsversteigerung, Leerstand, Zeitdruck, ...) und einen Score inkl. erkannter Motivations-Tags
  vergibt — siehe `src/lib/scoring.ts`.
- **Notizen & Status-Pipeline** je Lead (Neu → Kontaktiert → Im Gespräch → Termin → Qualifiziert → Gewonnen/Verloren)
- **Einstellungen**-Seite mit Übersicht der Datenquellen und rechtlichen Hinweisen

## Wichtiger rechtlicher Hinweis

Viele große Immobilienportale untersagen automatisiertes Auslesen (Scraping) ihrer Inserate in den AGB. LeadFlow
enthält deshalb bewusst **keinen Scraper** für Portale wie ImmoScout24 oder eBay Kleinanzeigen. Stattdessen stehen
zur Verfügung:

1. Offizielle APIs (z.B. ein ImmoScout24-Partnervertrag, Zugangsdaten in `.env` hinterlegen)
2. Eigene CSV-Listen / manuelle Erfassung
3. Die "Inserat einfügen"-Funktion, bei der der Nutzer selbst im Browser das Inserat öffnet und den Text kopiert

Details dazu auf der `/settings`-Seite im Tool.

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed   # optional: Beispiel-Leads anlegen
npm run dev
```

App läuft danach unter [http://localhost:3000](http://localhost:3000).

## Tech-Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma 7 (SQLite via `@prisma/adapter-better-sqlite3`, Driver Adapter)
- Zod für Validierung, Papaparse für CSV-Import

## Datenbank

SQLite-Datei `dev.db` im Projektverzeichnis (lokal, nicht eingecheckt). Für Produktivbetrieb kann der
`provider` in `prisma/schema.prisma` sowie der Adapter in `src/lib/prisma.ts` auf Postgres/MySQL umgestellt werden.
