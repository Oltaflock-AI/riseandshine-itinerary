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

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Pricing is split so nothing fake-precise is implied:
 *  - liveRows  = flights + hotels, the ACTUAL fetched totals (exact when the
 *    Amadeus provider is live; sample numbers are flagged via `priced`).
 *  - addOnRows = clearly-indicative extras, confirmed on the booking call.
 */
function pricing(
  req: TripRequest, perAdultUSD: number, hotelUSD: number,
  rooms_: number, priced: "live" | "sample",
): Pricing {
  const fx = fxRate();
  const paxForHotels = req.adults + req.children;          // infants share bed
  const paxForFlight = req.adults + req.children;          // lap-infant ≈ free
  const pax = paxForHotels;
  const rooms = rooms_;
  const flight = Math.round(perAdultUSD * paxForFlight);
  const hotels = Math.round(hotelUSD);

  const liveRows = [
    { label: `Flights — ${paxForFlight} traveller${paxForFlight > 1 ? "s" : ""} (fetched fare)`, usd: flight, kind: "live" as const },
    { label: `Hotels — ${rooms} room${rooms > 1 ? "s" : ""}, all nights (fetched rate)`, usd: hotels, kind: "live" as const },
  ];
  const liveCoreUSD = flight + hotels;

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

/** Sentinel thrown when a live-assistance toggle is ON but the upstream is unavailable. */
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
  const totalDays = req.durationNights + 1;
  const endDate = addDays(req.startDate, req.durationNights);
  // Sequence the trip FROM where they land — nearest city to the airport first.
  const cityLegs = orderedCities(dest);
  const nights = splitNights(cityLegs, req.durationNights);

  // ── Parallel fan-out (live calls gated on assistance toggles) ──
  const [flightsRes, hotelsRes, reddit, ...poiResults] = await Promise.all([
    req.flightAssist
      ? liveFlights(dest.originAirport, dest.arrivalAirport, req.startDate, endDate, req.adults)
      : Promise.resolve(null),
    req.hotelAssist
      ? liveHotels(cityLegs[0].hotelCity, cityLegs[0].lat, cityLegs[0].lng,
          req.startDate, endDate, req.adults, req.durationNights)
      : Promise.resolve(null),
    redditSignal(dest.name),
    ...cityLegs.map((c) => cityPOIs(c.name, c.lat, c.lng, req.diet, req.travelStyle, req.groupType)),
  ]);

  // Hard-block when the client opted into assistance but live provider failed.
  if (req.flightAssist && !flightsRes) throw new LiveProviderUnavailable("flights");
  if (req.hotelAssist  && !hotelsRes)  throw new LiveProviderUnavailable("hotels");

  const flights = flightsRes ?? sampleFlights(dest.arrivalCity);
  const hotels =
    hotelsRes && hotelsRes.length
      ? hotelsRes.slice(0, cityLegs.length).map((h, i) => ({ ...h, nights: nights[i] ?? h.nights }))
      : sampleHotels(dest.key, req.budgetTier, nights);

  // City contexts for the engine (carry hotel coords for geo-efficient routing)
  let cursor = req.startDate;
  const cities: CityContext[] = cityLegs.map((c, i) => {
    const arriveDate = cursor;
    cursor = addDays(cursor, nights[i]);
    return {
      name: c.name, nights: nights[i], arriveDate,
      pois: poiResults[i], hotelName: hotels[i]?.name ?? `${c.name} hotel`,
      hotelLat: hotels[i]?.lat ?? c.lat, hotelLng: hotels[i]?.lng ?? c.lng,
    };
  });

  const ctx: ComposeContext = {
    dest, cities, totalDays,
    arrivalLabel: flights.outbound.arr,
    departureLabel: flights.inbound.dep,
  };

  const [claudeDays, intel] = await Promise.all([
    composeDaysWithClaude(req, ctx),
    synthesizeIntel(dest.name, reddit, req.diet),
  ]);
  const engineSource: "live" | "sample" = claudeDays ? "live" : "sample";
  const days = claudeDays ?? composeDaysTemplate(req, ctx);

  const pax = req.adults + req.children;
  const rooms = Math.max(1, Math.ceil(pax / 3));
  const hotelTotalUSD = hotels.reduce((s, h) => s + h.totalUSD, 0) * rooms;
  // pricedLive only when *every requested* live segment actually came back live.
  const flightsLive = req.flightAssist && flights.source === "live";
  const hotelsLive  = req.hotelAssist  && (hotels[0]?.source ?? "sample") === "live";
  const anyLiveOpted = req.flightAssist || req.hotelAssist;
  const pricedLive: "live" | "sample" =
    anyLiveOpted && (!req.flightAssist || flightsLive) && (!req.hotelAssist || hotelsLive)
      ? "live" : "sample";
  const price = pricing(req, flights.perAdultUSD, hotelTotalUSD, rooms, pricedLive);

  const groupLabel =
    `${req.adults} Adult${req.adults > 1 ? "s" : ""}` +
    (req.children ? ` + ${req.children} Child${req.children > 1 ? "ren" : ""}` : "") +
    (req.infants  ? ` + ${req.infants} Infant${req.infants > 1 ? "s" : ""}` : "");
  const dietLabel =
    req.diet === "veg" ? "Vegetarian" : req.diet === "jain" ? "Jain"
    : req.diet === "non-veg" ? "Non-Veg" : "Mixed";
  const budgetLabel =
    req.budgetTier === 3 ? "Budget (3★)" : req.budgetTier === 4 ? "Mid-range (4★)" : "Luxury (5★)";

  const placesLive = poiResults.every((p) => p.source === "live");

  return {
    meta: {
      destinationName: dest.name, title: dest.title, tagline: dest.tagline,
      startDate: req.startDate, endDate, groupLabel, dietLabel, budgetLabel,
      visaNeeded: req.visaNeeded, pulledAt: new Date().toISOString().slice(0, 10),
    },
    flights, hotels, days, intel, pricing: price,
    freshness: {
      flights: req.flightAssist ? flights.source : "indicative",
      hotels:  req.hotelAssist  ? (hotels[0]?.source ?? "sample") : "indicative",
      places: placesLive ? "live" : "sample",
      intel: intel.source,
      engine: engineSource,
    },
  } satisfies ItineraryResult;
}
