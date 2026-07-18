import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LeadForm } from "@/components/lead-form";
import { NotesSection } from "@/components/notes-section";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SOURCE_LABELS, scoreColor } from "@/lib/labels";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "desc" } } },
  });

  if (!lead) notFound();

  const tags: string[] = lead.motivationTags ? JSON.parse(lead.motivationTags) : [];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{lead.name || "Unbenannter Lead"}</h1>
            <p className="text-sm text-neutral-500">
              Quelle: {SOURCE_LABELS[lead.source]}
              {lead.sourceUrl && (
                <>
                  {" · "}
                  <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    Inserat öffnen
                  </a>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={scoreColor(lead.score)}>Score: {lead.score}</Badge>
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <LeadForm
            leadId={lead.id}
            initialValues={{
              name: lead.name ?? "",
              phone: lead.phone ?? "",
              email: lead.email ?? "",
              address: lead.address ?? "",
              postalCode: lead.postalCode ?? "",
              city: lead.city ?? "",
              propertyType: lead.propertyType,
              livingArea: lead.livingArea?.toString() ?? "",
              plotArea: lead.plotArea?.toString() ?? "",
              rooms: lead.rooms?.toString() ?? "",
              buildYear: lead.buildYear?.toString() ?? "",
              askingPrice: lead.askingPrice?.toString() ?? "",
              sourceUrl: lead.sourceUrl ?? "",
              situation: lead.situation ?? "",
              status: lead.status,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Notizen & Verlauf</h2>
        </CardHeader>
        <CardContent>
          <NotesSection leadId={lead.id} notes={lead.notes} />
        </CardContent>
      </Card>
    </div>
  );
}
