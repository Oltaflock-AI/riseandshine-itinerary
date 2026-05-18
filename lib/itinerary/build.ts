import { DESTINATIONS, splitNights } from "@/lib/destinations";
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

function pricing(req: TripRequest, perAdultUSD: number, hotelUSD: number): Pricing {
  const fx = fxRate();
  const pax = req.adults + req.children;
  const rooms = Math.max(1, Math.ceil(pax / 3));
  const flight = perAdultUSD * pax;
  const hotels = hotelUSD * rooms;
  const transfers = 90 * pax;
  const activities = 120 * pax;
  const visa = req.visaNeeded ? 30 * pax : 0;
  const insurance = 8 * pax;
  const rows = [
    { label: `Flights — ${pax} traveller${pax > 1 ? "s" : ""}`, usd: flight },
    { label: `Hotels — ${rooms} room${rooms > 1 ? "s" : ""}`, usd: hotels },
    { label: "Private AC transfers & intercity", usd: transfers },
    { label: "Tours & activities", usd: activities },
    ...(visa ? [{ label: `Visa assistance (${pax} pax)`, usd: visa }] : []),
    { label: `Travel insurance (${pax} pax)`, usd: insurance },
  ];
  const subtotal = rows.reduce((s, r) => s + r.usd, 0);
  const serviceUSD = Math.round(subtotal * 0.12);
  const grandUSD = subtotal + serviceUSD;
  return { fx, rows, serviceUSD, grandUSD, perPersonUSD: grandUSD / pax, rooms, pax };
}

export async function buildItinerary(req: TripRequest): Promise<ItineraryResult> {
  const dest = DESTINATIONS[req.destinationKey] ?? DESTINATIONS.thailand;
  const totalDays = req.durationNights + 1;
  const endDate = addDays(req.startDate, req.durationNights);
  const nights = splitNights(dest, req.durationNights);

  // ── Parallel fan-out ──
  const [flightsRes, hotelsRes, reddit, ...poiResults] = await Promise.all([
    liveFlights(dest.originAirport, dest.arrivalAirport, req.startDate, endDate, req.adults),
    liveHotels(dest.cities[0].hotelCity, dest.cities[0].lat, dest.cities[0].lng,
      req.startDate, endDate, req.adults, req.durationNights),
    redditSignal(dest.name),
    ...dest.cities.map((c) => cityPOIs(c.name, c.lat, c.lng, req.diet)),
  ]);

  const flights = flightsRes ?? sampleFlights(dest.arrivalCity);
  const hotels =
    hotelsRes && hotelsRes.length
      ? hotelsRes.slice(0, dest.cities.length).map((h, i) => ({ ...h, nights: nights[i] ?? h.nights }))
      : sampleHotels(dest.key, req.budgetTier, nights);

  // City contexts for the engine
  let cursor = req.startDate;
  const cities: CityContext[] = dest.cities.map((c, i) => {
    const arriveDate = cursor;
    cursor = addDays(cursor, nights[i]);
    return {
      name: c.name, nights: nights[i], arriveDate,
      pois: poiResults[i], hotelName: hotels[i]?.name ?? `${c.name} hotel`,
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

  const hotelTotalUSD = hotels.reduce((s, h) => s + h.totalUSD, 0);
  const price = pricing(req, flights.perAdultUSD, hotelTotalUSD);

  const groupLabel =
    `${req.adults} Adult${req.adults > 1 ? "s" : ""}` +
    (req.children ? ` + ${req.children} Child${req.children > 1 ? "ren" : ""}` : "");
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
      flights: flights.source,
      hotels: hotels[0]?.source ?? "sample",
      places: placesLive ? "live" : "sample",
      intel: intel.source,
      engine: engineSource,
    },
  } satisfies ItineraryResult;
}
