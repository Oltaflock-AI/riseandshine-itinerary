import { NextRequest, NextResponse } from "next/server";
import { TripRequestSchema } from "@/lib/itinerary/schema";
import { buildItinerary } from "@/lib/itinerary/build";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = TripRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid trip request", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const result = await buildItinerary(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    console.error("itinerary build failed", e);
    return NextResponse.json(
      { error: "Itinerary build failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
