import { DESTINATIONS, orderedCities, splitNights } from "@/lib/destinations";
import { liveFlights, liveHotels } from "@/lib/providers/amadeus";
import { cityPOIs } from "@/lib/providers/googlePlaces";
import { redditSignal } from "@/lib/providers/reddit";
import { sampleFlights, sampleHotels } from "@/lib/providers/sampleData";
import {
  composeDaysWithClaude, composeDaysTemplate, synthesizeIntel,
  type ComposeContext, type CityContext,
} from "@/lib/itinerary/compose";
import { fxRate } from "@/lib/money";
import type { ItineraryResult, Pricing, TripRequest } from "@/lib/itinerary/schema";

const DISCLAIMER =
  "All prices are indicative and subject to change. Flight fares, hotel rates and visa fees vary by demand, season and availability and are confirmed only on the booking call. Quoted figures do not constitute a guarantee.";

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Pricing rows are conditional on which assistance the client toggled on.
 *  - Flight/Hotel rows: only included when the matching toggle is ON.
 *  - Add-ons: travel insurance always, visa only if visaNeeded, etc.
 */
function pricing(
  req: TripRequest,
  perAdultUSD: number, hotelUSD: number,
  rooms_: number, priced: "live" | "sample",
): Pricing {
  const fx = fxRate();
  const paxForHotels = req.adults + req.children;
  const paxForFlight = req.adults + req.children;
  const pax = paxForHotels;
  const rooms = rooms_;
  const flight = Math.round(perAdultUSD * paxForFlight);
  const hotels = Math.round(hotelUSD);

  const liveRows: Pricing["liveRows"] = [];
  if (req.flightAssist) {
    liveRows.push({
      label: `Flights — ${paxForFlight} traveller${paxForFlight > 1 ? "s" : ""}${priced === "live" ? " (fetched fare)" : " (indicative sample)"}`,
      usd: flight, kind: "live",
    });
  }
  if (req.hotelAssist) {
    liveRows.push({
      label: `Hotels — ${rooms} room${rooms > 1 ? "s" : ""}, all nights${priced === "live" ? " (fetched rate)" : " (indicative sample)"}`,
      usd: hotels, kind: "live",
    });
  }
  const liveCoreUSD = liveRows.reduce((s, r) => s + r.usd, 0);

  const visa = req.visaNeeded ? 30 * pax : 0;
  const addOnRows = [
    { label: "Private AC transfers & intercity", usd: 90 * pax, kind: "estimate" as const },
    { label: "Tours, entries & activities", usd: 120 * pax, kind: "estimate" as const },
    ...(visa ? [{ label: `Visa assistance (${pax} pax)`, usd: visa, kind: "estimate" as const }] : []),
    ...(req.flightAssist ? [{ label: "Flight booking & change support", usd: 25 * paxForFlight, kind: "estimate" as const }] : []),
    ...(req.hotelAssist  ? [{ label: "Hotel booking & front-desk support", usd: 20 * rooms, kind: "estimate" as const }] : []),
    { label: `Travel insurance (${pax} pax)`, usd: 8 * pax, kind: "estimate" as const },
  ];
  const addOnsUSD = addOnRows.reduce((s, r) => s + r.usd, 0);

  const serviceUSD = Math.round((liveCoreUSD + addOnsUSD) * 0.12);
  const grandUSD = liveCoreUSD + addOnsUSD + serviceUSD;
  return {
    fx, liveRows, liveCoreUSD, addOnRows, addOnsUSD,
    serviceUSD, grandUSD, perPersonUSD: grandUSD / (pax || 1), rooms, pax, priced,
  };
}

/**
 * Retained for backwards-compat. The build flow no longer throws this — when a
 * live provider is unavailable we silently fall back to sample (and flag it).
 */
export class LiveProviderUnavailable extends Error {
  readonly which: "flights" | "hotels";
  constructor(which: "flights" | "hotels") {
    super(`live_provider_unavailable:${which}`);
    this.which = which;
    this.name = "LiveProviderUnavailable";
  }
}

export async function buildItinerary(req: TripRequest): Promise<ItineraryResult> {
  const dest = DESTINATIONS[req.destinationKey] ?? DESTINATIONS.thailand;
  const durationNights = req.durationNights ?? 5;
  const totalDays = durationNights + 1;
  const endDate = addDays(req.startDate, durationNights);
  const cityLegs = orderedCities(dest);
  const nights = splitNights(cityLegs, durationNights);

  // ── Parallel fan-out. Live providers only called when the matching toggle is ON. ──
  const [flightsRes, hotelsRes, reddit, ...poiResults] = await Promise.all([
    req.flightAssist
      ? liveFlights(dest.originAirport, dest.arrivalAirport, req.startDate, endDate, req.adults)
      : Promise.resolve(null),
    req.hotelAssist
      ? liveHotels(cityLegs[0].hotelCity, cityLegs[0].lat, cityLegs[0].lng,
          req.startDate, endDate, req.adults, durationNights)
      : Promise.resolve(null),
    redditSignal(dest.name),
    ...cityLegs.map((c) => cityPOIs(c.name, c.lat, c.lng, req.diet ?? "veg", req.travelStyle ?? "balanced", req.groupType ?? "family")),
  ]);

  // Always compute a flight + hotel context for the engine (timing day 1, hotel anchors),
  // but only expose them in the result when the client requested that assistance.
  const flightsCtx = flightsRes ?? sampleFlights(dest, req.startDate, endDate);
  const hotelsCtx =
    hotelsRes && hotelsRes.length
      ? hotelsRes.slice(0, cityLegs.length).map((h, i) => ({ ...h, nights: nights[i] ?? h.nights }))
      : sampleHotels(dest.key, req.budgetTier ?? 4, nights);

  // City contexts for the engine (carry hotel coords for geo-efficient routing)
  let cursor = req.startDate;
  const cities: CityContext[] = cityLegs.map((c, i) => {
    const arriveDate = cursor;
    cursor = addDays(cursor, nights[i]);
    return {
      name: c.name, nights: nights[i], arriveDate,
      pois: poiResults[i], hotelName: hotelsCtx[i]?.name ?? `${c.name} hotel`,
      hotelLat: hotelsCtx[i]?.lat ?? c.lat, hotelLng: hotelsCtx[i]?.lng ?? c.lng,
    };
  });

  const ctx: ComposeContext = {
    dest, cities, totalDays,
    arrivalLabel: flightsCtx.outbound.arr,
    departureLabel: flightsCtx.inbound.dep,
  };

  const [claudeDays, intel] = await Promise.all([
    composeDaysWithClaude(req, ctx),
    synthesizeIntel(dest.name, reddit, req.diet ?? "veg"),
  ]);
  const engineSource: "live" | "sample" = claudeDays ? "live" : "sample";
  const days = claudeDays ?? composeDaysTemplate(req, ctx);

  const pax = req.adults + req.children;
  const rooms = Math.max(1, Math.ceil(pax / 3));
  const hotelTotalUSD = hotelsCtx.reduce((s, h) => s + h.totalUSD, 0) * rooms;
  const flightsLive = req.flightAssist && flightsCtx.source === "live";
  const hotelsLive  = req.hotelAssist  && (hotelsCtx[0]?.source ?? "sample") === "live";
  const anyLiveOpted = req.flightAssist || req.hotelAssist;
  const pricedLive: "live" | "sample" =
    anyLiveOpted && (!req.flightAssist || flightsLive) && (!req.hotelAssist || hotelsLive)
      ? "live" : "sample";
  const price = pricing(req, flightsCtx.perAdultUSD, hotelTotalUSD, rooms, pricedLive);

  const groupLabel =
    `${req.adults} Adult${req.adults > 1 ? "s" : ""}` +
    (req.children ? ` + ${req.children} Child${req.children > 1 ? "ren" : ""}` : "") +
    (req.infants  ? ` + ${req.infants} Infant${req.infants > 1 ? "s" : ""}` : "");
  const dietLabel =
    (req.diet ?? "veg") === "veg" ? "Vegetarian" : (req.diet ?? "veg") === "jain" ? "Jain"
    : (req.diet ?? "veg") === "non-veg" ? "Non-Veg" : "Mixed";
  const tier = req.budgetTier ?? 4;
  const budgetLabel =
    tier === 3 ? "Budget (3★)" : tier === 4 ? "Mid-range (4★)" : "Luxury (5★)";

  const placesLive = poiResults.every((p) => p.source === "live");

  return {
    meta: {
      destinationName: dest.name, title: dest.title, tagline: dest.tagline,
      startDate: req.startDate, endDate, groupLabel, dietLabel, budgetLabel,
      visaNeeded: req.visaNeeded ?? false, pulledAt: new Date().toISOString().slice(0, 10),
      disclaimer: DISCLAIMER,
      originAirport: dest.originAirport,
    },
    flights: req.flightAssist ? flightsCtx : null,
    hotels:  req.hotelAssist  ? hotelsCtx  : null,
    visa:    req.visaNeeded   ? dest.visa  : null,
    days, intel, pricing: price,
    freshness: {
      flights: req.flightAssist ? flightsCtx.source : "indicative",
      hotels:  req.hotelAssist  ? (hotelsCtx[0]?.source ?? "sample") : "indicative",
      places: placesLive ? "live" : "sample",
      intel: intel.source,
      engine: engineSource,
    },
  } satisfies ItineraryResult;
}
