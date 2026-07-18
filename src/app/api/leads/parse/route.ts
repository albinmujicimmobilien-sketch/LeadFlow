import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseListingText } from "@/lib/listingParser";
import { scoreLead } from "@/lib/scoring";

const schema = z.object({ text: z.string().trim().min(1) });

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const listing = parseListingText(parsed.data.text);
  const { score, tags } = scoreLead(listing.situation);

  return NextResponse.json({ listing, preview: { score, tags } });
}
