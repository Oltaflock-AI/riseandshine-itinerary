import { NextRequest, NextResponse } from "next/server";
import { buildCatalogItinerary } from "@/lib/catalog/build";
import { isCatalogPackage } from "@/lib/catalog";
import { DemoTripRequestSchema } from "@/lib/itinerary/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = DemoTripRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid trip request", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  if (!isCatalogPackage(parsed.data.destinationKey)) {
    return NextResponse.json(
      { error: "Package not available", detail: "This demo only includes catalog packages." },
      { status: 404 },
    );
  }

  try {
    const result = buildCatalogItinerary(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    console.error("itinerary build failed", e);
    return NextResponse.json(
      { error: "Itinerary build failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
