# Fördertraining – Online-Terminbuchung (Expo)

Eltern buchen selbst einen freien Termin für das Fördertraining ihres Kindes – per App **oder im Browser**.
Du als Trainer schaltest Termine frei und siehst alle Buchungen mit Kontaktdaten.

## Funktionen

**Für Eltern (ohne Login)**
- Freie Termine nach Tag und Uhrzeit wählen (volle Termine werden ausgeblendet)
- Buchungsformular: Elternname, E-Mail, Telefon (optional), Vorname des Kindes, Klassenstufe, Förderbereich, Nachricht
- Pflicht-Häkchen für die Datenschutzhinweise
- Sofortige Bestätigung mit **Buchungscode** (kopieren / teilen)
- Selbst stornieren mit Buchungscode + E-Mail (bis 24 Std. vorher, einstellbar)

**Für dich (Trainer-Bereich, Login nötig)**
- Kennzahlen: kommende Termine, gebucht, frei, Auslastung
- Filter: kommende / mit Buchung / noch frei / vergangene
- Buchungsdetails inkl. E-Mail- und Anruf-Button, Buchung stornieren, Termin löschen
- Termine in Serie anlegen: mehrere Tage × mehrere Uhrzeiten × bis zu 12 Wochen wöchentlich
- Einzel- oder Gruppentermine (bis 6 Kinder pro Termin)

## Schnellstart (Demo-Modus, ohne Backend)

Voraussetzung: **Node.js 22 oder 24 (LTS)**. Mit Node 20 oder älter startet die App nicht bzw. zeigt nur eine leere Seite. Prüfen mit `node -v`.

```bash
cd foerdertraining-app
npm install
npx expo start          # QR-Code mit der App „Expo Go“ scannen
npx expo start --web    # oder direkt im Browser
```

Ohne Supabase-Zugangsdaten läuft die App im **Demo-Modus**: Beispieltermine, Daten nur lokal auf dem Gerät.
Trainer-Login im Demo-Modus: PIN `1234`.

## Live-Betrieb mit Supabase (ca. 15 Minuten)

Damit alle Eltern dieselben Termine sehen, braucht die App eine gemeinsame Datenbank.

1. Kostenloses Projekt auf [supabase.com](https://supabase.com) anlegen – **Region „Frankfurt (eu-central-1)“ wählen**.
2. **SQL Editor** → Inhalt von `supabase/schema.sql` einfügen → *Run*.
3. **Authentication → Users → Add user**: deinen Trainer-Login (E-Mail + Passwort) anlegen, die User-ID kopieren.
4. Im SQL Editor ausführen: `insert into public.admins (user_id) values ('DEINE-USER-ID');`
5. **Authentication → Sign In / Providers**: „Allow new users to sign up“ **deaktivieren**.
6. `.env.example` nach `.env` kopieren und URL + anon/publishable Key aus *Project Settings → API* eintragen.
7. `npx expo start` neu starten – der Demo-Hinweis verschwindet, Login erfolgt per E-Mail + Passwort.

### Sicherheitskonzept (in `schema.sql` umgesetzt und getestet)
- Eltern haben **keinen direkten Tabellenzugriff**. Sie sehen freie Termine nur über eine Funktion, die keine Personendaten enthält.
- Buchen und Stornieren laufen über geprüfte Datenbank-Funktionen; Überbuchung ist durch Zeilensperre ausgeschlossen.
- Nur Konten in der Tabelle `admins` sehen Buchungen. Andere angemeldete Konten sehen nichts.

## Veröffentlichen

| Weg | Für wen | Aufwand |
|---|---|---|
| **Web-Version** (`npx expo export --platform web` → Ordner `dist/` z. B. auf Netlify/Vercel hochladen) | **Eltern** – Link auf Website, Instagram, WhatsApp, QR-Code im Flyer | gering |
| Expo Go | Dich zum Testen | keiner |
| App Store / Play Store (`npx eas-cli@latest build`) | Optional | Apple-Developer-Konto (99 $/Jahr), Review |

**Empfehlung:** Eltern über den Web-Link buchen lassen (keine App-Installation = mehr Buchungen), du nutzt die App.
Beim Webhosting alle Pfade auf `index.html` umleiten (Single-Page-App).

## Anpassen

Alle Texte, Förderbereiche, Klassenstufen, Kontaktdaten, Links und die Stornofrist stehen in
`src/lib/config.ts`. Farben in `src/constants/theme.ts`.
Wenn du die Stornofrist änderst, auch in `supabase/schema.sql` (Funktion `cancel_booking`) anpassen.

## Vor dem Livegang – rechtliche Checkliste (bitte prüfen lassen)

- [ ] **Datenschutzerklärung** um die Online-Buchung ergänzen (Zweck, Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO, Speicherdauer, Supabase als Auftragsverarbeiter) und URL in `config.ts` eintragen
- [ ] **Impressum** verlinken
- [ ] **AV-Vertrag (DPA)** mit Supabase abschließen (im Dashboard verfügbar), Region EU wählen
- [ ] Das Formular fragt bewusst **keine Diagnosen/Gesundheitsdaten** ab (Art. 9 DSGVO) – im Freitextfeld wird darauf hingewiesen
- [ ] **Löschkonzept**: alte Buchungen regelmäßig löschen, z. B. 6 Monate nach Termin
- [ ] Stornobedingungen / ggf. AGB und Ausfallhonorar klar kommunizieren

## Sinnvolle Erweiterungen

1. **Automatische Bestätigungs-E-Mail** an Eltern + Benachrichtigung an dich: Supabase *Database Webhook* auf Tabelle `bookings` → Zapier/Make → E-Mail (oder Supabase Edge Function + Resend).
2. **Erinnerung 24 Std. vorher** per E-Mail/SMS (reduziert No-Shows deutlich).
3. Kalender-Sync (Google Calendar) für deine Termine.
4. Bot-Schutz (z. B. Cloudflare Turnstile), falls Spam-Buchungen auftreten.

## Projektstruktur

```
src/app/                 Screens (Expo Router)
  index.tsx              Freie Termine (Eltern)
  buchen/[slotId].tsx    Buchungsformular
  bestaetigung.tsx       Bestätigung mit Buchungscode
  stornieren.tsx         Buchung verwalten / stornieren
  admin/index.tsx        Trainer-Login + Übersicht
  admin/neu.tsx          Termine anlegen (inkl. Serien)
src/lib/api.ts           Datenschicht (Supabase live / Demo lokal)
src/lib/config.ts        Alle anpassbaren Texte & Einstellungen
supabase/schema.sql      Datenbank, Rechte, Buchungslogik
```

Prüfen: `npm run typecheck` · `npm run lint`
