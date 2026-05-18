import { generateObject } from "ai";
import {
  DayPlanSchema, Intel, type Day, type Place, type TripRequest,
} from "@/lib/itinerary/schema";
import { getItineraryModel } from "@/lib/providers/claude";
import type { CityPOIs } from "@/lib/providers/googlePlaces";
import type { Destination } from "@/lib/destinations";

export interface CityContext {
  name: string;
  nights: number;
  arriveDate: string; // YYYY-MM-DD this city's stay begins
  pois: CityPOIs;
  hotelName: string;
}

export interface ComposeContext {
  dest: Destination;
  cities: CityContext[];
  arrivalLabel: string;   // "15 Jun · 19:15" from real/sample flight
  departureLabel: string; // last-day flight time
  totalDays: number;      // nights + 1
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function weekday(iso: string): string {
  return WEEKDAYS[new Date(iso + "T00:00:00Z").getUTCDay()];
}

/** Build the grounded prompt context (only real places the model may use). */
function groundingJSON(req: TripRequest, ctx: ComposeContext) {
  return JSON.stringify({
    destination: ctx.dest.name,
    startDate: req.startDate,
    totalDays: ctx.totalDays,
    group: { adults: req.adults, children: req.children, childrenAges: req.childrenAges },
    diet: req.diet,
    interests: req.interests,
    flightArrival: ctx.arrivalLabel,
    flightDeparture: ctx.departureLabel,
    cities: ctx.cities.map((c) => ({
      name: c.name,
      nights: c.nights,
      hotel: c.hotelName,
      attractions: c.pois.attractions.map(slim),
      restaurants: c.pois.restaurants.map(slim),
    })),
  });
}
function slim(p: Place) {
  return { name: p.name, category: p.category, lat: p.lat, lng: p.lng, rating: p.rating, tag: p.tag, veg: p.vegFriendly };
}
function findPlace(ctx: ComposeContext, name: string): Place | null {
  for (const c of ctx.cities)
    for (const p of [...c.pois.attractions, ...c.pois.restaurants])
      if (p.name.toLowerCase() === String(name).toLowerCase()) return p;
  return null;
}

const SYSTEM = `You are a senior India-based luxury travel planner building a DONE-FOR-YOU hour-by-hour itinerary.
Hard rules:
- Use ONLY places from the provided cities[].attractions / cities[].restaurants. Never invent a place.
- Every day is a continuous timed schedule (24h HH:MM), realistic pacing incl. transit, meals, rest. No gaps, no overlaps.
- Day 1 begins at the flight arrival time; the final day ends with the departure transfer/flight. Insert an intercity travel block when the city changes.
- Pace for the group (kids => earlier nights, fewer stops, no nightlife). Respect diet for EVERY meal block: veg/jain => only veg/jain restaurants.
- meal blocks: kind="meal", give 2-3 real restaurant options (from restaurants[]) in "options".
- sightseeing/activity blocks: set "place" to the matched attraction.
- detail = ONE short sentence (max 22 words). title = max 6 words. Keep it visual and skimmable, not an essay.
- Output strictly matches the schema.`;

/** Claude path: structured hour-by-hour days grounded on real data. */
export async function composeDaysWithClaude(
  req: TripRequest, ctx: ComposeContext,
): Promise<Day[] | null> {
  const model = getItineraryModel();
  if (!model) return null;
  try {
    const { object } = await generateObject({
      model,
      schema: DayPlanSchema,
      system: SYSTEM,
      prompt:
        `Build the full ${ctx.totalDays}-day itinerary from this real data:\n` +
        groundingJSON(req, ctx) +
        `\nReturn ${ctx.totalDays} days, dayIndex 0..${ctx.totalDays - 1}, dates from ${req.startDate}.`,
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
      maxRetries: 1,
    });
    // Re-attach full Place objects (photos/mapsUrl) the model only referenced by name.
    const days = object.days.map((d) => ({
      ...d,
      blocks: d.blocks.map((b) => ({
        ...b,
        place: b.place ? (findPlace(ctx, b.place.name) ?? b.place) : null,
        options: (b.options ?? []).map((o) => findPlace(ctx, o.name) ?? o),
      })),
    }));
    return days;
  } catch {
    return null;
  }
}

/** Deterministic fallback: solid hour-by-hour plan with no LLM. */
export function composeDaysTemplate(req: TripRequest, ctx: ComposeContext): Day[] {
  const days: Day[] = [];
  let dayIndex = 0;
  let cityIdx = 0;
  let dayInCity = 0;

  const meal = (start: string, end: string, label: string, c: CityContext) => ({
    start, end, kind: "meal" as const, title: label,
    detail: `${label} — pick one of the options below (diet-matched).`,
    place: null,
    options: c.pois.restaurants.slice(0, 3),
  });

  for (let i = 0; i < ctx.totalDays; i++) {
    const date = addDays(req.startDate, i);
    const c = ctx.cities[Math.min(cityIdx, ctx.cities.length - 1)];
    const att = c.pois.attractions;
    const isFirst = i === 0;
    const isLast = i === ctx.totalDays - 1;
    const cityChange = !isFirst && dayInCity === 0 && cityIdx > 0;

    let blocks;
    if (isFirst) {
      blocks = [
        { start: "00:00", end: ctx.arrivalLabel.split("· ")[1] ?? "13:00", kind: "travel" as const,
          title: `Fly to ${ctx.dest.arrivalCity}`, detail: `Arrive ${ctx.arrivalLabel}. Private AC transfer to ${c.hotelName}.`,
          place: null, options: [] },
        { start: "15:00", end: "16:00", kind: "checkin" as const, title: "Hotel check-in",
          detail: `Check in at ${c.hotelName}, freshen up and rest.`, place: null, options: [] },
        { start: "16:30", end: "18:30", kind: "sightseeing" as const, title: att[0]?.name ?? "Easy first outing",
          detail: att[0]?.tag ? `${att[0].name} — ${att[0].tag}.` : `Gentle first look at ${c.name}.`,
          place: att[0] ?? null, options: [] },
        meal("19:30", "21:00", "Dinner", c),
      ];
    } else if (isLast) {
      blocks = [
        meal("08:00", "09:00", "Breakfast", c),
        { start: "09:30", end: "11:00", kind: "leisure" as const, title: "Last-minute leisure",
          detail: "Pool / souvenir shopping near the hotel.", place: null, options: [] },
        { start: "12:00", end: "13:00", kind: "transfer" as const, title: "Airport transfer",
          detail: "Private AC transfer to the airport.", place: null, options: [] },
        { start: "13:00", end: "23:59", kind: "travel" as const, title: "Return flight",
          detail: `Departure ${ctx.departureLabel}.`, place: null, options: [] },
      ];
    } else if (cityChange) {
      blocks = [
        meal("08:00", "09:00", "Breakfast", c),
        { start: "09:30", end: "13:00", kind: "transfer" as const, title: `Travel to ${c.name}`,
          detail: `Scenic transfer to ${c.name}; check in at ${c.hotelName}.`, place: null, options: [] },
        meal("13:30", "14:30", "Lunch", c),
        { start: "15:00", end: "18:00", kind: "sightseeing" as const, title: att[0]?.name ?? "Local highlight",
          detail: att[0]?.tag ? `${att[0].name} — ${att[0].tag}.` : `First highlight in ${c.name}.`,
          place: att[0] ?? null, options: [] },
        meal("19:30", "21:00", "Dinner", c),
      ];
    } else {
      const a1 = att[(dayInCity * 2) % Math.max(1, att.length)];
      const a2 = att[(dayInCity * 2 + 1) % Math.max(1, att.length)];
      blocks = [
        meal("08:00", "09:00", "Breakfast", c),
        { start: "09:00", end: "12:30", kind: "sightseeing" as const, title: a1?.name ?? "Morning sights",
          detail: a1?.tag ? `${a1.name} — ${a1.tag}.` : `Explore ${a1?.name ?? c.name}.`,
          place: a1 ?? null, options: [] },
        meal("12:30", "14:00", "Lunch", c),
        { start: "14:00", end: "17:30", kind: "activity" as const, title: a2?.name ?? "Afternoon activity",
          detail: a2?.tag ? `${a2.name} — ${a2.tag}.` : `Continue with ${a2?.name ?? "a local experience"}.`,
          place: a2 ?? null, options: [] },
        { start: "17:30", end: "19:00", kind: "leisure" as const, title: "Leisure / pool",
          detail: "Downtime at the hotel or a short stroll.", place: null, options: [] },
        meal("19:30", "21:00", "Dinner", c),
      ];
    }

    days.push({ dayIndex, date, weekday: weekday(date), cityLabel: c.name,
      headline: isFirst ? `Arrive ${ctx.dest.arrivalCity}` : isLast ? "Departure" : cityChange ? `Hello ${c.name}` : `${c.name} highlights`,
      blocks });

    dayIndex++;
    dayInCity++;
    if (!isFirst && dayInCity >= c.nights && cityIdx < ctx.cities.length - 1) { cityIdx++; dayInCity = 0; }
  }
  return days;
}

// ── Intel synthesis ──
const SAMPLE_INTEL: Record<string, Omit<Intel, "source">> = {
  Thailand: {
    do: [
      "Phi Phi on the 07:00 small speedboat, not the midday ferry — Maya Bay caps daily numbers.",
      "Base in Kata / Kata Noi (calm, family) — not Patong-centre.",
      "In Bangkok use BTS / MRT over taxis — beats the traffic.",
      "Agree taxi & tuk-tuk price before boarding; refuse any ‘gem shop’ detour.",
    ],
    skip: [
      "Patong jet-ski rentals — #1 fake damage-claim scam.",
      "Bangla Road photo & ‘free show’ hustles — padded bills.",
      "Tiger Kingdom / elephant riding — choose an ethical sanctuary.",
      "Gem ‘wholesale resale’ shops — pure scam.",
    ],
    miss: [
      "Old Phuket Town Sino-Portuguese lanes — calm, photogenic, kid-friendly.",
      "Phang Nga / James Bond Island by longtail.",
      "Ethical elephant sanctuary (feed & bathe).",
      "Early Damnoen Saduak / Amphawa floating market.",
    ],
    diet: "Sukhumvit (Bangkok) has strong Indian-veg & Jain kitchens — pre-booked per your dietary input.",
    sources: "Synthesised from current traveller-consensus sources; mirrors r/Thailand & r/phuket.",
  },
};

export async function synthesizeIntel(
  destinationName: string, snippets: string[] | null, diet: string,
): Promise<Intel> {
  const model = getItineraryModel();
  if (model && snippets && snippets.length) {
    try {
      const { z } = await import("zod");
      const { object } = await generateObject({
        model,
        schema: z.object({
          do: z.array(z.string()).max(5),
          skip: z.array(z.string()).max(5),
          miss: z.array(z.string()).max(5),
          diet: z.string(),
        }),
        system:
          "Distil real Reddit traveller threads into crisp, specific advice for a family trip. " +
          "Each item ≤20 words, concrete, no fluff. Tailor the diet line to the given diet.",
        prompt: `Destination: ${destinationName}. Diet: ${diet}.\nReddit threads:\n${snippets.join("\n")}`,
        maxRetries: 1,
      });
      return { ...object, sources: "Live r/* threads, distilled by Claude.", source: "live" };
    } catch {
      /* fall through to sample */
    }
  }
  const s = SAMPLE_INTEL[destinationName] ?? {
    do: ["Book key activities before you fly.", "Carry small cash for local transport."],
    skip: ["Unlicensed street operators.", "Anything that pressures an on-the-spot payment."],
    miss: ["The signature local viewpoint.", "One authentic local meal away from tourist strips."],
    diet: "Veg/Jain restaurants are pre-shortlisted in each day below.",
    sources: "Curated sample — connect the Reddit API for live, distilled intel.",
  };
  return { ...s, source: "sample" };
}
