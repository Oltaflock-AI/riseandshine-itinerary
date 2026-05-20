import { generateObject } from "ai";
import { z } from "zod";
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
  hotelLat: number;
  hotelLng: number;
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
// ── geo helpers ──
function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/** Nearest-neighbour route through places, starting from `from` (the hotel). */
function route<T extends { lat: number; lng: number }>(from: { lat: number; lng: number }, pts: T[]): T[] {
  const rem = [...pts], out: T[] = [];
  let cur = from;
  while (rem.length) {
    let bi = 0, bd = Infinity;
    rem.forEach((p, i) => { const d = km(cur, p); if (d < bd) { bd = d; bi = i; } });
    const n = rem.splice(bi, 1)[0]; out.push(n); cur = n;
  }
  return out;
}

const TOURISTY = /market|palace|night|floating|tiger|crocodile|zoo|cabaret|walking street/i;
function isTouristy(p: Place): boolean {
  return TOURISTY.test(p.name) || TOURISTY.test(p.category) ||
    (p.reviews != null && p.reviews > 12000);
}

/** Apply the traveller's touristy/off-beat preference; surface what we drop. */
function styleFilter(
  att: Place[],
  style: TripRequest["travelStyle"],
  group: TripRequest["groupType"] = "family",
) {
  let kept: Place[];
  let skipped: Place[] = [];
  if (style === "touristy") {
    kept = [...att].sort((a, b) =>
      (Number(b.rating ?? 0) * Math.log10((b.reviews ?? 10) + 10)) -
      (Number(a.rating ?? 0) * Math.log10((a.reviews ?? 10) + 10)));
  } else if (style === "offbeat") {
    const touristy = att.filter(isTouristy);
    const calm = att.filter((p) => !isTouristy(p));
    skipped = touristy.slice(0, 3);
    kept = calm.length >= 3 ? calm : [...calm, ...touristy.slice(3)];
  } else {
    kept = att; // balanced
  }
  // groupType post-filter
  if (group === "honeymoon") {
    const isFamilyCluster = (p: Place) => /family|theme park|water park|zoo/i.test(p.category) || /family|kids/i.test(p.name);
    const drop = kept.filter(isFamilyCluster);
    if (drop.length) {
      skipped = [...skipped, ...drop];
      kept = kept.filter((p) => !isFamilyCluster(p));
    }
  }
  if (group === "bikers") {
    // boost outdoor / road-trip POIs to the front when present.
    const outdoor = (p: Place) => /viewpoint|beach|nature|park|scenic|hill|coast|drive|road/i.test(p.category + " " + (p.tag ?? ""));
    kept = [...kept].sort((a, b) => Number(outdoor(b)) - Number(outdoor(a)));
  }
  return { kept, skipped };
}

const DEST_SKIP: Record<string, string[]> = {
  Thailand: [
    "Jet-ski rentals on the beach — the classic fake-damage scam; use the hotel desk.",
    "Bangla Road photo / “free show” touts — padded bills.",
    "Gem ‘wholesale resale’ shops — pure scam.",
  ],
  Bali: [
    "Pushy Kuta beach hawkers & ‘free’ bracelets — walk on.",
    "Renting a scooter without a licence/IDP — fines + insurance void.",
    "Tanah Lot at mid-day — coach crush; sunset only.",
  ],
  Kerala: ["Unbranded ‘ayurveda’ touts near jetties.", "Overpriced spice-shop ‘factory tours’."],
  Mauritius: ["Beach ‘free catamaran’ pitches that end at a sales room."],
  Maldives: ["Booking excursions ad-hoc on arrival — pre-book at the resort for half the price."],
  Rajasthan: ["Aggressive ‘government emporium’ taxi detours.", "Camel-cart ‘photo’ fees agreed after the ride."],
};

/** Build the grounded prompt context (only real places the model may use). */
function groundingJSON(req: TripRequest, ctx: ComposeContext) {
  return JSON.stringify({
    destination: ctx.dest.name,
    startDate: req.startDate,
    totalDays: ctx.totalDays,
    group: { adults: req.adults, children: req.children, infants: req.infants, childrenAges: req.childrenAges },
    diet: req.diet,
    interests: req.interests,
    travelStyle: req.travelStyle,
    groupType: req.groupType,
    assistance: { flight: req.flightAssist, hotel: req.hotelAssist, visa: req.visaNeeded },
    flightArrival: ctx.arrivalLabel,
    flightDeparture: ctx.departureLabel,
    note: "cities[] are already ordered from the arrival airport — keep that order; do not backtrack.",
    cities: ctx.cities.map((c) => ({
      name: c.name,
      nights: c.nights,
      hotel: c.hotelName,
      hotelLat: c.hotelLat,
      hotelLng: c.hotelLng,
      attractions: c.pois.attractions.map(slim),
      restaurants: c.pois.restaurants.map(slim),
    })),
  });
}
function slim(p: Place) {
  return { name: p.name, category: p.category, lat: p.lat, lng: p.lng, rating: p.rating, reviews: p.reviews, tag: p.tag, veg: p.vegFriendly };
}
function findPlace(ctx: ComposeContext, name: string): Place | null {
  for (const c of ctx.cities)
    for (const p of [...c.pois.attractions, ...c.pois.restaurants])
      if (p.name.toLowerCase() === String(name).toLowerCase()) return p;
  return null;
}

const SYSTEM = `You are a senior India-based luxury travel planner producing a DONE-FOR-YOU, highly detailed, hour-by-hour itinerary the client can follow without any further decisions.
Non-negotiables:
- Use ONLY places from cities[].attractions / cities[].restaurants. Never invent a place.
- TRAVEL-EFFICIENT ROUTING: each day must be a tight geographic loop. Group stops that are close together (use lat/lng); never zig-zag across the city/island; never send them back to an area they already covered. Start each city near its hotel, then radiate outward day by day.
- Sequence the trip FORWARD from where they land: cities[] is already ordered from the arrival airport — keep that order. Day 1 begins at the exact flight arrival time and place; the final day ends at the departure transfer. Add an intercity transfer block when the city changes.
- For EVERY day also fill: "efficiency" (one line on why today's routing is tight, e.g. "all stops within the Seminyak–Canggu strip, ≤15 min hops") and "skip" (2-3 lines: what NOT to do today and why — tourist traps, scams, time-wasters, double-ups, or sights that clash with their travel style).
- TWO independent axes both shape the plan:
   • travelStyle (vibe): touristy = include the marquee icons; offbeat = avoid crowded tourist-trap stops and prefer local/quiet picks (and say so in skip); balanced = a smart mix.
   • groupType (who is travelling) layers on top:
       - family    ⇒ kid-pacing, earlier nights, fewer stops/day, no nightlife, kid-food, stroller-aware.
       - solo      ⇒ flexible/lighter, social cafés & day-tours, single-room context, easy public-transit picks.
       - honeymoon ⇒ quieter & romantic, sunset/private dining, drop family-cluster spots, couple-only experiences.
       - bikers    ⇒ self-drive backbone, bike-friendly stops, scenic-road preference, fuel/repair note per leg, avoid heavy urban traffic legs.
- Pace constraint triggers when children > 0 OR infants > 0 (not just children). Respect diet for EVERY meal: veg/jain ⇒ only veg/jain restaurants. meal blocks: kind="meal", 2-3 restaurant options near that day's area, vary them across days (don't repeat the same 3 every meal).
- Honour the assistance booleans: if assistance.flight=true mention the picked flight in the day's travel block; if assistance.hotel=true reference the actual hotel name for check-in/leisure; if assistance.visa=true include a one-line visa reminder on day 1.
- sightseeing/activity blocks: set "place" to the matched attraction. Be specific and detailed in "detail" (what to actually do/see there, best timing, ≤24 words). title ≤6 words.
- Continuous timed schedule (24h HH:MM), realistic transit & rest, no gaps/overlaps. Output strictly matches the schema.`;

/**
 * LEAN model schema: the model only emits place/restaurant *names* (it must
 * pick from the grounded lists). Full Place objects (photos/coords/maps) are
 * re-attached in code. Keeps structured output small ⇒ fast & reliable.
 */
const LeanPlan = z.object({
  days: z.array(z.object({
    date: z.string(),
    cityLabel: z.string(),
    headline: z.string(),
    efficiency: z.string(),
    skip: z.array(z.string()).min(1),
    blocks: z.array(z.object({
      start: z.string(), end: z.string(),
      kind: z.enum(["travel", "checkin", "sightseeing", "activity", "meal", "leisure", "transfer"]),
      title: z.string(), detail: z.string(),
      placeName: z.string().nullable(),
      optionNames: z.array(z.string()).default([]),
    })),
  })),
});

const CITY_TIMEOUT_MS = 60_000;

function cityGroundingJSON(
  req: TripRequest, ctx: ComposeContext, c: CityContext,
  role: { isFirst: boolean; isLast: boolean; prevCity: string | null; dayCount: number },
) {
  return JSON.stringify({
    destination: ctx.dest.name,
    city: c.name,
    hotel: c.hotelName, hotelLat: c.hotelLat, hotelLng: c.hotelLng,
    daysToPlan: role.dayCount,
    group: { adults: req.adults, children: req.children, infants: req.infants, childrenAges: req.childrenAges },
    diet: req.diet, interests: req.interests,
    travelStyle: req.travelStyle, groupType: req.groupType,
    assistance: { flight: req.flightAssist, hotel: req.hotelAssist, visa: req.visaNeeded },
    role: {
      ...(role.isFirst
        ? { firstDayIsArrival: true, flightArrival: ctx.arrivalLabel }
        : { firstDayIsTransferFrom: role.prevCity }),
      ...(role.isLast ? { lastDayIsDeparture: true, flightDeparture: ctx.departureLabel } : {}),
    },
    attractions: c.pois.attractions.map(slim),
    restaurants: c.pois.restaurants.map(slim),
  });
}

/** Generate ONE city's day-block plan (lean, grounded, time-boxed). */
async function composeCity(
  req: TripRequest, ctx: ComposeContext, c: CityContext,
  role: { isFirst: boolean; isLast: boolean; prevCity: string | null; dayCount: number },
) {
  const model = getItineraryModel()!;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), CITY_TIMEOUT_MS);
  try {
    const { object } = await generateObject({
      model,
      schema: LeanPlan,
      system: SYSTEM,
      prompt:
        `Plan ONLY the ${role.dayCount} day(s) in ${c.name} from this real data:\n` +
        cityGroundingJSON(req, ctx, c, role) +
        `\nReturn exactly ${role.dayCount} day object(s) for ${c.name}. ` +
        (role.isFirst
          ? `Day 1 starts at the flight arrival ("${ctx.arrivalLabel}") + transfer to the hotel; keep day 1 light. `
          : `Day 1 here opens with the inbound transfer from ${role.prevCity} + hotel check-in. `) +
        (role.isLast ? `The final day ends with the airport transfer + departure ("${ctx.departureLabel}"). ` : "") +
        `placeName/optionNames MUST be exact names copied from the lists. ` +
        `Every day MUST include "efficiency" and a non-empty "skip" array.`,
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
      maxRetries: 0,
      abortSignal: ac.signal,
    });
    return object.days;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Claude path: each city planned in PARALLEL (smaller, concurrent calls — far
 * faster & more reliable than one giant generation), then stitched in order.
 */
export async function composeDaysWithClaude(
  req: TripRequest, ctx: ComposeContext,
): Promise<Day[] | null> {
  if (!getItineraryModel()) return null;
  const last = ctx.cities.length - 1;
  const roles = ctx.cities.map((c, i) => ({
    isFirst: i === 0,
    isLast: i === last,
    prevCity: i === 0 ? null : ctx.cities[i - 1].name,
    dayCount: c.nights + (i === last ? 1 : 0), // +1 = departure day on last city
  }));
  try {
    const perCity = await Promise.all(
      ctx.cities.map((c, i) => composeCity(req, ctx, c, roles[i])),
    );
    let idx = 0;
    const days: Day[] = [];
    for (const cityDays of perCity) {
      if (!cityDays?.length) return null; // any city failed ⇒ whole fallback
      for (const d of cityDays) {
        const date = addDays(req.startDate, idx);
        days.push({
          dayIndex: idx, date, weekday: weekday(date),
          cityLabel: d.cityLabel, headline: d.headline,
          efficiency: d.efficiency, skip: d.skip ?? [],
          blocks: d.blocks.map((b) => ({
            start: b.start, end: b.end, kind: b.kind, title: b.title, detail: b.detail,
            place: b.placeName ? findPlace(ctx, b.placeName) : null,
            options: (b.optionNames ?? [])
              .map((n) => findPlace(ctx, n)).filter((p): p is Place => p !== null),
          })),
        });
        idx++;
      }
    }
    return days.length ? days : null;
  } catch {
    return null; // timeout / failure ⇒ deterministic template takes over
  }
}

/** Deterministic fallback — now geo-efficient, style-aware, with skip + efficiency. */
export function composeDaysTemplate(req: TripRequest, ctx: ComposeContext): Day[] {
  const days: Day[] = [];
  const destSkip = DEST_SKIP[ctx.dest.name] ?? ["Anything that pressures an on-the-spot cash payment."];

  // Pre-compute, per city: style-filtered + geo-routed attraction order, and a
  // restaurant pool routed the same way (so dining is near the day's stops).
  const cityPlan = ctx.cities.map((c) => {
    const { kept, skipped } = styleFilter(c.pois.attractions, req.travelStyle, req.groupType);
    const hotel = { lat: c.hotelLat, lng: c.hotelLng };
    return {
      c,
      routed: route(hotel, kept),
      rests: route(hotel, c.pois.restaurants),
      skippedNames: skipped.map((p) => p.name),
    };
  });

  let cityIdx = 0, dayInCity = 0, attCursor = 0, restCursor = 0;

  const mealBlock = (start: string, end: string, label: string, plan: (typeof cityPlan)[number]) => {
    const pool = plan.rests.length ? plan.rests : plan.c.pois.restaurants;
    const opts: Place[] = [];
    for (let k = 0; k < 3 && pool.length; k++) opts.push(pool[(restCursor + k) % pool.length]);
    restCursor += 3;
    return {
      start, end, kind: "meal" as const, title: label,
      detail: `${label} near today's area — choose one (all ${req.diet === "non-veg" ? "" : req.diet + " "}diet-matched).`,
      place: null, options: opts,
    };
  };
  const sight = (start: string, end: string, p: Place | undefined, kind: "sightseeing" | "activity") => ({
    start, end, kind,
    title: p?.name?.slice(0, 42) ?? "Local highlight",
    detail: p ? `${p.name}${p.tag ? " — " + p.tag : ""}${p.rating ? ` (★ ${p.rating})` : ""}. Allow ~2–3 hrs; go early to beat crowds.` : "Explore a local highlight.",
    place: p ?? null, options: [] as Place[],
  });

  for (let i = 0; i < ctx.totalDays; i++) {
    const date = addDays(req.startDate, i);
    const plan = cityPlan[Math.min(cityIdx, cityPlan.length - 1)];
    const c = plan.c;
    const isFirst = i === 0;
    const isLast = i === ctx.totalDays - 1;
    const cityChange = !isFirst && dayInCity === 0 && cityIdx > 0;
    const arrTime = ctx.arrivalLabel.split("· ")[1]?.trim() || "13:00";

    let blocks, headline, efficiency, skip: string[];

    if (isFirst) {
      blocks = [
        { start: "00:00", end: arrTime, kind: "travel" as const, title: `Land in ${ctx.dest.arrivalCity}`,
          detail: `Arrive ${ctx.arrivalLabel}. Fast-track + private AC transfer straight to ${c.hotelName}.`, place: null, options: [] },
        { start: "15:00", end: "16:00", kind: "checkin" as const, title: "Hotel check-in",
          detail: `Check in at ${c.hotelName}, freshen up — keep day 1 light after the flight.`, place: null, options: [] },
        sight("16:30", "18:30", plan.routed[0], "sightseeing"),
        mealBlock("19:30", "21:00", "Dinner", plan),
      ];
      attCursor = 1;
      headline = `Land — settle into ${c.name}`;
      efficiency = `Nothing far on day 1: one stop a short hop from ${c.hotelName}, then dinner nearby.`;
      skip = ["Don't over-schedule arrival day — jet lag + transfer eats the afternoon.", destSkip[0]];
    } else if (isLast) {
      blocks = [
        mealBlock("08:00", "09:00", "Breakfast", plan),
        { start: "09:30", end: "11:00", kind: "leisure" as const, title: "Pack & last stroll",
          detail: "Pool time or a short walk near the hotel — nothing that risks the flight.", place: null, options: [] },
        { start: "11:30", end: "12:30", kind: "transfer" as const, title: "Airport transfer",
          detail: "Private AC transfer to the airport (buffer for traffic + check-in).", place: null, options: [] },
        { start: "12:30", end: "23:59", kind: "travel" as const, title: "Return flight",
          detail: `Departure ${ctx.departureLabel}.`, place: null, options: [] },
      ];
      headline = "Departure";
      efficiency = "Zero detours — only hotel-area time before the airport run.";
      skip = ["No far-flung sights today — a missed flight isn't worth one more temple.", "Skip last-minute ‘duty-free’ gem/electronics ‘deals’."];
    } else if (cityChange) {
      blocks = [
        mealBlock("08:00", "09:00", "Breakfast", plan),
        { start: "09:30", end: "13:00", kind: "transfer" as const, title: `Transfer to ${c.name}`,
          detail: `Scenic transfer to ${c.name}; check in at ${c.hotelName}. Stops chosen on-route, not backtracking.`, place: null, options: [] },
        mealBlock("13:30", "14:30", "Lunch", plan),
        sight("15:00", "18:00", plan.routed[0], "sightseeing"),
        mealBlock("19:30", "21:00", "Dinner", plan),
      ];
      attCursor = 1;
      headline = `Onward to ${c.name}`;
      efficiency = `Moved with the route (no backtrack); first ${c.name} stop is the one closest to ${c.hotelName}.`;
      skip = [`Skip add-on detours during the transfer that double the drive.`, destSkip[Math.min(1, destSkip.length - 1)]];
    } else {
      const a1 = plan.routed[attCursor % Math.max(1, plan.routed.length)];
      const a2 = plan.routed[(attCursor + 1) % Math.max(1, plan.routed.length)];
      attCursor += 2;
      const hop = a1 && a2 ? km(a1, a2) : 0;
      blocks = [
        mealBlock("08:00", "09:00", "Breakfast", plan),
        sight("09:00", "12:30", a1, "sightseeing"),
        mealBlock("12:30", "14:00", "Lunch", plan),
        sight("14:00", "17:30", a2, "activity"),
        { start: "17:30", end: "19:00", kind: "leisure" as const, title: "Leisure / pool",
          detail: "Downtime back at the hotel or a sunset spot near today's area.", place: null, options: [] },
        mealBlock("19:30", "21:00", "Dinner", plan),
      ];
      headline = `${c.name} — ${a1?.category ?? "highlights"} day`;
      efficiency = a1 && a2
        ? `Today's two stops are ~${hop.toFixed(1)} km apart — one tight loop, no cross-town backtracking.`
        : `Compact ${c.name} day kept close to the hotel.`;
      skip = [];
      if (plan.skippedNames.length && dayInCity === 0)
        skip.push(`Deliberately skipping (off-beat pick): ${plan.skippedNames.join(", ")} — tourist crush.`);
      skip.push(destSkip[(i + 1) % destSkip.length]);
      if (req.children > 0) skip.push("No late nightlife — group has children; nights kept early.");
    }

    days.push({ dayIndex: i, date, weekday: weekday(date), cityLabel: c.name, headline, efficiency, skip, blocks });

    dayInCity++;
    if (!isFirst && dayInCity >= c.nights && cityIdx < ctx.cities.length - 1) { cityIdx++; dayInCity = 0; attCursor = 0; }
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
