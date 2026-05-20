import { NextRequest, NextResponse } from "next/server";
import { TripRequestSchema } from "@/lib/itinerary/schema";
import { buildItinerary, LiveProviderUnavailable } from "@/lib/itinerary/build";

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
    if (e instanceof LiveProviderUnavailable) {
      return NextResponse.json(
        {
          error: "live_provider_unavailable",
          which: e.which,
          message: "Live booking provider not configured — see Setup.",
        },
        { status: 503 },
      );
    }
    console.error("itinerary build failed", e);
    return NextResponse.json(
      { error: "Itinerary build failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
