/**
 * Zentrale Konfiguration – hier passt du Texte, Angebote und Kontaktdaten an.
 * Alles, was Eltern in der App sehen, kommt aus dieser Datei.
 */
export const AppConfig = {
  /** Name deines Angebots (erscheint im Header und auf der Startseite) */
  brandName: 'Fördertraining',
  /** Kurzer Einleitungstext für Eltern */
  welcomeText:
    'Wählen Sie einen freien Termin für das Fördertraining Ihres Kindes. Die Buchung dauert weniger als eine Minute – Sie erhalten sofort einen Buchungscode.',
  /** Angebotene Förderbereiche (Auswahl im Buchungsformular) */
  focusAreas: ['Lesen & Schreiben (LRS)', 'Rechnen (Dyskalkulie)', 'Konzentration', 'Deutsch', 'Mathematik', 'Sonstiges'],
  /** Klassenstufen zur Auswahl */
  gradeLevels: ['Vorschule', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Oberstufe'],
  /** Ort / Format, wird bei jedem Termin angezeigt, falls am Slot nichts anderes hinterlegt ist */
  defaultLocation: 'Praxisräume (Adresse folgt per E-Mail)',
  /** Kontakt für Rückfragen */
  contactEmail: 'kontakt@example.de',
  contactPhone: '',
  /** Link zur Datenschutzerklärung (Pflicht! Bitte eigene URL eintragen) */
  privacyUrl: 'https://example.de/datenschutz',
  /** Link zum Impressum */
  imprintUrl: 'https://example.de/impressum',
  /** Bis wie viele Stunden vor Termin Eltern selbst stornieren dürfen */
  cancellationHours: 24,
  /** Standard-Dauer neuer Slots in Minuten */
  defaultDurationMinutes: 45,
  /**
   * PIN für den Trainer-Bereich im DEMO-Modus (ohne Supabase).
   * Im Live-Betrieb erfolgt der Login über Supabase (E-Mail + Passwort).
   */
  demoAdminPin: '1234',
} as const;
