import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadInputSchema } from "@/lib/validation";
import { buildLeadData } from "@/lib/leads";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctx.params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "desc" } } },
  });

  if (!lead) return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = leadInputSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });

  const merged = buildLeadData({
    name: parsed.data.name ?? existing.name ?? undefined,
    phone: parsed.data.phone ?? existing.phone ?? undefined,
    email: parsed.data.email ?? existing.email ?? undefined,
    address: parsed.data.address ?? existing.address ?? undefined,
    postalCode: parsed.data.postalCode ?? existing.postalCode ?? undefined,
    city: parsed.data.city ?? existing.city ?? undefined,
    propertyType: parsed.data.propertyType ?? existing.propertyType,
    livingArea: parsed.data.livingArea ?? existing.livingArea ?? undefined,
    plotArea: parsed.data.plotArea ?? existing.plotArea ?? undefined,
    rooms: parsed.data.rooms ?? existing.rooms ?? undefined,
    buildYear: parsed.data.buildYear ?? existing.buildYear ?? undefined,
    askingPrice: parsed.data.askingPrice ?? existing.askingPrice ?? undefined,
    source: parsed.data.source ?? existing.source,
    sourceUrl: parsed.data.sourceUrl ?? existing.sourceUrl ?? undefined,
    situation: parsed.data.situation ?? existing.situation ?? undefined,
    status: parsed.data.status ?? existing.status,
  });

  const lead = await prisma.lead.update({ where: { id }, data: merged });
  return NextResponse.json({ lead });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctx.params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
