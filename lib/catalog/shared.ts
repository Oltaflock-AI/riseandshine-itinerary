import type { Flights, Hotel, Intel, Place, VisaInfo } from "@/lib/itinerary/schema";
import type { CatalogDayTemplate, CatalogPackage } from "./types";

export const DOMESTIC_VISA: VisaInfo = {
  type: "Domestic — No visa required",
  validity: "N/A",
  processing: "N/A",
  fee: "N/A",
  docs: "Government photo ID for all travellers (Aadhaar, PAN, or passport) at hotel check-in",
};

export const FX_DEFAULT = 85.5;

const maps = (q: string, lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export function mkPlace(
  name: string,
  category: string,
  lat: number,
  lng: number,
  photoUrl: string,
  rating = 4.5,
  reviews = 2000,
  tag?: string,
): Place {
  return {
    name,
    category,
    lat,
    lng,
    rating,
    reviews,
    priceLevel: null,
    photoUrl,
    mapsUrl: maps(name, lat, lng),
    vegFriendly: true,
    tag: tag ?? null,
  };
}

export function day(
  dayIndex: number,
  cityLabel: string,
  headline: string,
  overnight: string,
  activities: CatalogDayTemplate["activities"],
): CatalogDayTemplate {
  return { dayIndex, cityLabel, headline, overnight, activities };
}

export function act(
  period: string,
  title: string,
  detail: string,
  place: Place | null = null,
) {
  return { period, title, detail, place };
}

export function mkFlights(
  route: string,
  carrier: string,
  perAdultINR: number,
  outbound: Flights["outbound"],
  inbound: Flights["inbound"],
): Flights {
  return {
    carrier,
    perAdultUSD: Math.round(perAdultINR / FX_DEFAULT),
    fareNote: `Indicative round-trip economy from Ahmedabad (AMD). Average market fare ≈ ₹${perAdultINR.toLocaleString("en-IN")} per adult — confirmed on booking.`,
    source: "sample",
    alternatives: [],
    outbound,
    inbound,
  };
}

export function mkHotel(
  name: string,
  area: string,
  nights: number,
  nightlyINR: number,
  lat: number,
  lng: number,
  photoUrl: string,
  stars = 4,
): Hotel {
  const totalINR = nightlyINR * nights;
  return {
    name,
    area,
    stars,
    rating: 8.2 + Math.min(0.6, nights * 0.1),
    reviews: 800 + nights * 400,
    nights,
    totalUSD: Math.round(totalINR / FX_DEFAULT),
    strikeUSD: Math.round((totalINR * 1.18) / FX_DEFAULT),
    lat,
    lng,
    bookUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + area)}`,
    photoUrl,
    source: "sample",
    alternatives: [],
  };
}

export function mkIntel(
  doList: string[],
  skipList: string[],
  missList: string[],
  diet = "Vegetarian and Jain options widely available on Indian routes.",
): Intel {
  return {
    do: doList,
    skip: skipList,
    miss: missList,
    diet,
    sources: "Rise & Shine Travel · curated desk notes",
    source: "sample",
  };
}

export function defaultPricingINR(
  flightPerAdult: number,
  hotels: { nightly: number; nights: number }[],
  opts?: { transfersPerPax?: number; activitiesPerPax?: number },
) {
  return {
    flightPerAdult,
    hotels,
    transfersPerPax: opts?.transfersPerPax ?? 3500,
    activitiesPerPax: opts?.activitiesPerPax ?? 3000,
    insurancePerPax: 650,
    servicePct: 0.12,
  };
}

/** Local package heroes (accurate destinations) + CDN for the rest. */
const PKG = "/packages";

export const IMG = {
  /** Havelock Island — palm trees, white sand, turquoise water (Andaman). */
  andaman: `${PKG}/andaman.jpg`,
  andamanBeach: "https://images.unsplash.com/photo-1586053226626-febc8817962f?w=900&q=80",
  andamanCoast: "https://images.unsplash.com/photo-1545762374-d18079617da8?w=900&q=80",
  rajasthan: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=900&q=80",
  /** Kerala backwaters houseboat with palms (Alleppey-style). */
  kerala: `${PKG}/kerala.jpg`,
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=900&q=80",
  golden: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=900&q=80",
  /** Thai temple / landmark scene (Bangkok area). */
  thailand: `${PKG}/thailand.jpg`,
  mauritius: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=900&q=80",
  hongkong: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=900&q=80",
  /** Mauritius tropical coast (package also covers Dubai). */
  mauritiusDubai: `${PKG}/mauritius-dubai.jpg`,
  /** Marina Bay Sands — Singapore city + cruise hub. */
  cruise: `${PKG}/singapore-bali-cruise.jpg`,
  /** Singapore & Bali with Cruise — same skyline hero (not overwater resort). */
  singaporeBali: `${PKG}/singapore-bali-cruise.jpg`,
  /** Bali rice terraces / temple (day-trip imagery). */
  bali: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=900&q=80",
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
};

export type PkgMeta = Pick<
  CatalogPackage,
  | "key"
  | "category"
  | "name"
  | "title"
  | "tagline"
  | "tourName"
  | "durationNights"
  | "durationDays"
  | "routeSummary"
  | "heroImageUrl"
  | "flightRouteLabel"
  | "domestic"
  | "arrivalAirport"
>;

export function assemble(
  meta: PkgMeta,
  narrativeDays: CatalogDayTemplate[],
  flights: Flights,
  hotels: Hotel[],
  intel: Intel,
  pricingINR: CatalogPackage["pricingINR"],
  visa: VisaInfo | null = meta.domestic ? DOMESTIC_VISA : null,
): CatalogPackage {
  return {
    ...meta,
    originAirport: "AMD",
    narrativeDays,
    flights,
    hotels,
    visa,
    intel,
    pricingINR,
  };
}
