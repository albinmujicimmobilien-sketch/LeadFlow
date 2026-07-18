import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { scoreLead } from "../src/lib/scoring";

const url = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const demoLeads = [
  {
    name: "Erika Musterfrau",
    phone: "0170 1234567",
    email: "erika.musterfrau@example.com",
    address: "Ahornweg 4",
    postalCode: "80331",
    city: "München",
    propertyType: "EINFAMILIENHAUS" as const,
    livingArea: 145,
    plotArea: 480,
    rooms: 5,
    buildYear: 1978,
    askingPrice: 620000,
    source: "MANUAL" as const,
    situation: "Erbengemeinschaft möchte das Haus der verstorbenen Mutter zügig verkaufen, Haus steht seit 3 Monaten leer.",
  },
  {
    name: "Thomas Beispiel",
    phone: "0151 9876543",
    email: null,
    address: "Bahnhofstraße 12",
    postalCode: "50667",
    city: "Köln",
    propertyType: "EIGENTUMSWOHNUNG" as const,
    livingArea: 78,
    plotArea: null,
    rooms: 3,
    buildYear: 2005,
    askingPrice: 265000,
    source: "PASTE_PARSER" as const,
    situation: "Trennung, beide Partner wollen die Wohnung schnell verkaufen und Erlös aufteilen.",
  },
  {
    name: "Familie Schneider",
    phone: null,
    email: "schneider.familie@example.com",
    address: "Wiesenweg 7",
    postalCode: "22087",
    city: "Hamburg",
    propertyType: "MEHRFAMILIENHAUS" as const,
    livingArea: 320,
    plotArea: 650,
    rooms: 12,
    buildYear: 1962,
    askingPrice: 1150000,
    source: "CSV_IMPORT" as const,
    situation: "Vermieter hat keine Lust mehr auf Mietnomaden-Problem, überlegt Verkauf.",
  },
  {
    name: "Klaus Normalverbraucher",
    phone: "0176 5551234",
    email: "klaus.n@example.com",
    address: "Seestraße 3",
    postalCode: "10115",
    city: "Berlin",
    propertyType: "GRUNDSTUECK" as const,
    livingArea: null,
    plotArea: 900,
    rooms: null,
    buildYear: null,
    askingPrice: 340000,
    source: "MANUAL" as const,
    situation: "Grundstück seit Jahren unbebaut, Eigentümer plant Umzug ins Ausland und will nicht mehr verwalten.",
  },
];

async function main() {
  for (const lead of demoLeads) {
    const { score, tags } = scoreLead(lead.situation);
    await prisma.lead.create({
      data: {
        ...lead,
        motivationTags: JSON.stringify(tags),
        score,
      },
    });
  }
  console.log(`Seed abgeschlossen: ${demoLeads.length} Beispiel-Leads angelegt.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
