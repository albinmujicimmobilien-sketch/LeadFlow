/**
 * Heuristische Bewertung der Verkaufsbereitschaft eines Leads.
 * Durchsucht Freitext (Situation/Beschreibung) nach typischen Signalwörtern,
 * die auf einen dringenden oder wahrscheinlichen Verkaufswunsch hindeuten.
 */

type Signal = {
  tag: string;
  weight: number;
  keywords: string[];
};

export const MOTIVATION_SIGNALS: Signal[] = [
  {
    tag: "Erbschaft",
    weight: 25,
    keywords: ["erbschaft", "geerbt", "erbe ", "erbengemeinschaft", "nachlass"],
  },
  {
    tag: "Scheidung/Trennung",
    weight: 25,
    keywords: ["scheidung", "trennung", "getrennt", "auseinandersetzung"],
  },
  {
    tag: "Zwangsversteigerung",
    weight: 30,
    keywords: ["zwangsversteigerung", "zwangsvollstreckung", "insolvenz", "privatinsolvenz"],
  },
  {
    tag: "Finanzielle Notlage",
    weight: 20,
    keywords: ["finanzielle schwierigkeiten", "geldnot", "schulden", "kredit nicht", "zahlungsschwierigkeiten"],
  },
  {
    tag: "Pflege/Umzug ins Heim",
    weight: 20,
    keywords: ["pflegeheim", "pflegefall", "seniorenheim", "betreutes wohnen"],
  },
  {
    tag: "Umzug/Jobwechsel",
    weight: 15,
    keywords: ["umzug", "jobwechsel", "versetzung", "neue stelle", "auswanderung", "wegzug"],
  },
  {
    tag: "Leerstand",
    weight: 15,
    keywords: ["leerstand", "steht leer", "unbewohnt", "seit jahren leer"],
  },
  {
    tag: "Sanierungsstau",
    weight: 10,
    keywords: ["sanierungsstau", "renovierungsbedürftig", "modernisierungsbedarf", "baufällig"],
  },
  {
    tag: "Zeitdruck",
    weight: 15,
    keywords: ["schnell verkaufen", "dringend", "zügig verkaufen", "schneller verkauf", "muss weg"],
  },
  {
    tag: "Vermietung aufgeben",
    weight: 10,
    keywords: ["problem-mieter", "mietnomaden", "vermietung leid", "keine lust mehr zu vermieten"],
  },
];

export function scoreLead(situation: string | null | undefined): {
  score: number;
  tags: string[];
} {
  if (!situation) return { score: 0, tags: [] };

  const text = situation.toLowerCase();
  const matchedTags: string[] = [];
  let total = 0;

  for (const signal of MOTIVATION_SIGNALS) {
    const hit = signal.keywords.some((kw) => text.includes(kw));
    if (hit) {
      matchedTags.push(signal.tag);
      total += signal.weight;
    }
  }

  return { score: Math.min(100, total), tags: matchedTags };
}
