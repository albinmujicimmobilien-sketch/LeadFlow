import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, STATUS_COLORS, PROPERTY_TYPE_LABELS, SOURCE_LABELS, scoreColor } from "@/lib/labels";
import { LeadRowActions } from "@/components/lead-row-actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; minScore?: string }>;
}) {
  const params = await searchParams;

  const leads = await prisma.lead.findMany({
    where: {
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.minScore ? { score: { gte: Number(params.minScore) } } : {}),
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q } },
              { city: { contains: params.q } },
              { postalCode: { contains: params.q } },
              { address: { contains: params.q } },
              { situation: { contains: params.q } },
            ],
          }
        : {}),
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
  });

  const total = leads.length;
  const hot = leads.filter((l) => l.score >= 60).length;
  const open = leads.filter((l) => !["GEWONNEN", "VERLOREN"].includes(l.status)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-sm text-neutral-500">Leads gesamt</span>
            <span className="text-2xl font-semibold">{total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-sm text-neutral-500">Heiße Leads (Score ≥ 60)</span>
            <span className="text-2xl font-semibold">{hot}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-sm text-neutral-500">Offen in Bearbeitung</span>
            <span className="text-2xl font-semibold">{open}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" method="GET">
            <div className="min-w-48 flex-1">
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Suche</label>
              <Input name="q" defaultValue={params.q} placeholder="Name, Ort, PLZ, Adresse..." />
            </div>
            <div className="w-48">
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Status</label>
              <Select name="status" defaultValue={params.status ?? ""}>
                <option value="">Alle</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-40">
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Score min.
              </label>
              <Input name="minScore" type="number" min={0} max={100} defaultValue={params.minScore} />
            </div>
            <Button type="submit" variant="secondary">
              Filtern
            </Button>
            {(params.q || params.status || params.minScore) && (
              <Link href="/">
                <Button type="button" variant="ghost">
                  Zurücksetzen
                </Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Name / Objekt</th>
                <th className="px-4 py-3 font-medium">Ort</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Quelle</th>
                <th className="px-4 py-3 font-medium">Erfasst</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                >
                  <td className="px-4 py-3">
                    <Badge color={scoreColor(lead.score)}>{lead.score}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                      {lead.name || "Unbenannter Lead"}
                    </Link>
                    <div className="text-xs text-neutral-500">{PROPERTY_TYPE_LABELS[lead.propertyType]}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {[lead.postalCode, lead.city].filter(Boolean).join(" ") || "–"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={STATUS_COLORS[lead.status]}>{STATUS_LABELS[lead.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{SOURCE_LABELS[lead.source]}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {new Intl.DateTimeFormat("de-DE").format(lead.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <LeadRowActions leadId={lead.id} />
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-neutral-500">
                    Keine Leads gefunden. Lege einen{" "}
                    <Link href="/leads/new" className="underline">
                      neuen Lead
                    </Link>{" "}
                    an oder importiere eine CSV-Datei.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
