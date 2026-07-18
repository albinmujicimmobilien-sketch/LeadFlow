import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const noteSchema = z.object({ body: z.string().trim().min(1) });

export async function POST(request: NextRequest, ctx: RouteContext<"/api/leads/[id]/notes">) {
  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = noteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: { body: parsed.data.body, leadId: id },
  });

  return NextResponse.json({ note }, { status: 201 });
}
