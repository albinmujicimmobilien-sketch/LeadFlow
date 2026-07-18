import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadInputSchema } from "@/lib/validation";
import { buildLeadData } from "@/lib/leads";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const minScore = searchParams.get("minScore");

  const leads = await prisma.lead.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(minScore ? { score: { gte: Number(minScore) } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { city: { contains: q } },
              { postalCode: { contains: q } },
              { address: { contains: q } },
              { situation: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ leads });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = leadInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const lead = await prisma.lead.create({ data: buildLeadData(parsed.data) });
  return NextResponse.json({ lead }, { status: 201 });
}
