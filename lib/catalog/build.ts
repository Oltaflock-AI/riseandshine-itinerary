import { CATALOG_PACKAGES } from "./index";
import type { CatalogPackage } from "./types";
import { fxRate } from "@/lib/money";
import type {
  Day,
  DemoTripRequest,
  ItineraryResult,
  Pricing,
} from "@/lib/itinerary/schema";

const DISCLAIMER =
  "All prices are indicative averages (flights, 4-star hotels, transfers) and are subject to change. Fares and room rates vary by season and availability and are confirmed only on the booking call. Quoted figures are not a guarantee.";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function weekday(iso: string): string {
  return WEEKDAYS[new Date(iso + "T00:00:00Z").getUTCDay()];
}

function inrToUsd(inr: number, fx: number): number {
  return Math.round(inr / fx);
}

function buildPricing(
  pkg: CatalogPackage,
  req: DemoTripRequest,
  fx: number,
): Pricing {
  const pax = req.adults + req.children;
  const rooms = Math.max(1, Math.ceil(pax / 3));
  const flightINR = pkg.pricingINR.flightPerAdult * (req.adults + req.children);
  const hotelINR = pkg.pricingINR.hotels.reduce(
    (s, h) => s + h.nightly * h.nights,
    0,
  );
  const flightUSD = inrToUsd(flightINR, fx);
  const hotelUSD = inrToUsd(hotelINR * rooms, fx);

  const liveRows: Pricing["liveRows"] = [
    {
      label: `Flights — ${req.adults + req.children} traveller${pax > 1 ? "s" : ""} (avg. ${pkg.flightRouteLabel}, round trip)`,
      usd: flightUSD,
      kind: "estimate",
    },
    {
      label: `Hotels — ${rooms} room${rooms > 1 ? "s" : ""}, 4★ · ${pkg.routeSummary} (avg. nightly rates)`,
      usd: hotelUSD,
      kind: "estimate",
    },
  ];
  const liveCoreUSD = flightUSD + hotelUSD;

  const transfersUSD = inrToUsd(pkg.pricingINR.transfersPerPax * pax, fx);
  const activitiesUSD = inrToUsd(pkg.pricingINR.activitiesPerPax * pax, fx);
  const insuranceUSD = inrToUsd(pkg.pricingINR.insurancePerPax * pax, fx);

  const addOnRows: Pricing["addOnRows"] = [
    {
      label: "Private AC transfers, ferries & inter-island hops",
      usd: transfersUSD,
      kind: "estimate",
    },
    {
      label: "Sightseeing, entries & boat rides (Elephant Beach, etc.)",
      usd: activitiesUSD,
      kind: "estimate",
    },
    {
      label: `Travel insurance (${pax} traveller${pax > 1 ? "s" : ""})`,
      usd: insuranceUSD,
      kind: "estimate",
    },
    {
      label: "Flight & hotel booking support",
      usd: inrToUsd(1200 * pax, fx),
      kind: "estimate",
    },
  ];
  const addOnsUSD = addOnRows.reduce((s, r) => s + r.usd, 0);
  const serviceUSD = Math.round(
    (liveCoreUSD + addOnsUSD) * pkg.pricingINR.servicePct,
  );
  const grandUSD = liveCoreUSD + addOnsUSD + serviceUSD;

  return {
    fx,
    liveRows,
    liveCoreUSD,
    addOnRows,
    addOnsUSD,
    serviceUSD,
    grandUSD,
    perPersonUSD: grandUSD / (pax || 1),
    rooms,
    pax,
    priced: "sample",
  };
}

function buildDays(pkg: CatalogPackage, startDate: string): Day[] {
  return pkg.narrativeDays.map((d) => {
    const date = addDays(startDate, d.dayIndex);
    return {
      dayIndex: d.dayIndex,
      date,
      weekday: weekday(date),
      cityLabel: d.cityLabel,
      headline: d.headline,
      efficiency: "",
      skip: [],
      blocks: [],
      overnight: d.overnight,
      activities: d.activities,
    };
  });
}

export function buildCatalogItinerary(req: DemoTripRequest): ItineraryResult {
  const pkg = CATALOG_PACKAGES[req.destinationKey];
  if (!pkg) throw new Error(`Unknown catalog package: ${req.destinationKey}`);

  const endDate = addDays(req.startDate, pkg.durationNights);
  const fx = fxRate();
  const pax = req.adults + req.children;

  const groupLabel =
    `${req.adults} Adult${req.adults > 1 ? "s" : ""}` +
    (req.children
      ? ` + ${req.children} Child${req.children > 1 ? "ren" : ""}`
      : "") +
    (req.infants
      ? ` + ${req.infants} Infant${req.infants > 1 ? "s" : ""}`
      : "");

  return {
    meta: {
      destinationName: pkg.name,
      title: pkg.title,
      tagline: pkg.tagline,
      startDate: req.startDate,
      endDate,
      groupLabel,
      dietLabel: "As per package",
      budgetLabel: "4★ hotels (indicative)",
      visaNeeded: !pkg.domestic && pkg.visa != null,
      pulledAt: new Date().toISOString().slice(0, 10),
      disclaimer: DISCLAIMER,
      originAirport: pkg.originAirport,
    },
    flights: pkg.flights,
    hotels: pkg.hotels,
    visa: pkg.visa,
    days: buildDays(pkg, req.startDate),
    intel: pkg.intel,
    pricing: buildPricing(pkg, req, fx),
    freshness: {
      flights: "indicative",
      hotels: "indicative",
      places: "sample",
      intel: "sample",
      engine: "sample",
    },
    packageMode: "catalog",
  };
}

export function buildInquiryMessage(
  req: DemoTripRequest,
  result: ItineraryResult,
): string {
  const pkg = CATALOG_PACKAGES[req.destinationKey];
  return [
    `*Inquiry — Rise & Shine Travel*`,
    ``,
    `Package: ${pkg?.tourName ?? result.meta.title}`,
    `Route: ${pkg?.routeSummary ?? ""}`,
    `Dates: ${result.meta.startDate} → ${result.meta.endDate} (${pkg?.durationDays ?? ""} days)`,
    `Travellers: ${result.meta.groupLabel}`,
    ``,
    `Name: ${req.clientName}`,
    `Phone: ${req.clientPhone}`,
    ``,
    `Indicative total: ₹${Math.round(result.pricing.grandUSD * result.pricing.fx).toLocaleString("en-IN")} (approximately)`,
    ``,
    `Please share a final quote and availability.`,
  ].join("\n");
}
