import { z } from "zod";

/** Single physical place (restaurant, monument, attraction) from Google Places. */
export const PlaceSchema = z.object({
  name: z.string(),
  category: z.string().describe("e.g. Temple, Beach, Museum, Restaurant"),
  lat: z.number(),
  lng: z.number(),
  rating: z.number().nullable().describe("Google rating /5, null if unknown"),
  reviews: z.number().nullable(),
  priceLevel: z.number().nullable().describe("0-4, null if unknown"),
  photoUrl: z.string().nullable(),
  mapsUrl: z.string(),
  vegFriendly: z.boolean().default(false),
  tag: z.string().nullable().describe("short hook e.g. 'sunset point', 'Jain menu'"),
});
export type Place = z.infer<typeof PlaceSchema>;

export const BlockKind = z.enum([
  "travel", "checkin", "sightseeing", "activity", "meal", "leisure", "transfer",
]);

/** One timed block of a day, e.g. 09:00–10:00. */
export const TimeBlockSchema = z.object({
  start: z.string().describe("24h HH:MM"),
  end: z.string().describe("24h HH:MM"),
  kind: BlockKind,
  title: z.string().describe("short, ≤6 words"),
  detail: z.string().describe("one short sentence, ≤22 words"),
  place: PlaceSchema.nullable(),
  /** For kind==="meal": 2-3 real restaurant options to choose from. */
  options: z.array(PlaceSchema).default([]),
});
export type TimeBlock = z.infer<typeof TimeBlockSchema>;

export const DaySchema = z.object({
  dayIndex: z.number(),
  date: z.string().describe("YYYY-MM-DD"),
  weekday: z.string(),
  cityLabel: z.string().describe("e.g. Bangkok / Phuket — Kata"),
  headline: z.string().describe("≤7 words, the theme of the day"),
  efficiency: z.string().describe("one line on why this day is travel-efficient, e.g. 'tight Seminyak↔Canggu loop, ≤15 min hops'"),
  skip: z.array(z.string()).default([]).describe("what to deliberately NOT do today and why (1 short line each)"),
  blocks: z.array(TimeBlockSchema),
});
export type Day = z.infer<typeof DaySchema>;

/** What the Claude engine returns (just the day plan — everything else is wired in code). */
export const DayPlanSchema = z.object({ days: z.array(DaySchema) });
export type DayPlan = z.infer<typeof DayPlanSchema>;

// ── Non-LLM structured pieces (assembled by the orchestrator) ──

export const FlightLeg = z.object({
  label: z.string(), route: z.string(), flights: z.string(),
  dep: z.string(), arr: z.string(), dur: z.string(), stops: z.string(),
});
export const Flights = z.object({
  carrier: z.string(),
  outbound: FlightLeg, inbound: FlightLeg,
  fareNote: z.string(),
  perAdultUSD: z.number(),
  source: z.enum(["live", "sample"]),
});
export type Flights = z.infer<typeof Flights>;

export const Hotel = z.object({
  name: z.string(), area: z.string(), stars: z.number(),
  rating: z.number(), reviews: z.number(), nights: z.number(),
  totalUSD: z.number(), strikeUSD: z.number().nullable(),
  lat: z.number(), lng: z.number(), bookUrl: z.string(),
  photoUrl: z.string().nullable(), source: z.enum(["live", "sample"]),
});
export type Hotel = z.infer<typeof Hotel>;

export const Intel = z.object({
  do: z.array(z.string()), skip: z.array(z.string()), miss: z.array(z.string()),
  diet: z.string(), sources: z.string(), source: z.enum(["live", "sample"]),
});
export type Intel = z.infer<typeof Intel>;

export const TripRequestSchema = z.object({
  clientName: z.string().default("Valued Guest"),
  clientPhone: z.string().default(""),
  destinationKey: z.string(),
  durationNights: z.number().int().min(2).max(20),
  budgetTier: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  startDate: z.string(),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(12).default(0),
  childrenAges: z.array(z.number()).default([]),
  diet: z.enum(["veg", "jain", "non-veg", "mixed"]).default("veg"),
  interests: z.array(z.string()).default([]),
  travelStyle: z.enum(["touristy", "balanced", "offbeat"]).default("balanced"),
  visaNeeded: z.boolean().default(false),
});
export type TripRequest = z.infer<typeof TripRequestSchema>;

export const PriceRow = z.object({
  label: z.string(),
  usd: z.number(),
  kind: z.enum(["live", "estimate"]),
});
export const PricingSchema = z.object({
  fx: z.number(),
  /** exact, fetched line items (flights + hotels) */
  liveRows: z.array(PriceRow),
  liveCoreUSD: z.number(),
  /** clearly-indicative add-ons, confirmed on the booking call */
  addOnRows: z.array(PriceRow),
  addOnsUSD: z.number(),
  serviceUSD: z.number(),
  grandUSD: z.number(),
  perPersonUSD: z.number(),
  rooms: z.number(),
  pax: z.number(),
  /** "live" only when BOTH flights & hotels came from a live provider */
  priced: z.enum(["live", "sample"]),
});
export type Pricing = z.infer<typeof PricingSchema>;

export interface ItineraryResult {
  meta: {
    destinationName: string; title: string; tagline: string;
    startDate: string; endDate: string; groupLabel: string;
    dietLabel: string; budgetLabel: string; visaNeeded: boolean;
    pulledAt: string;
  };
  flights: Flights;
  hotels: Hotel[];
  days: Day[];
  intel: Intel;
  pricing: Pricing;
  freshness: Record<"flights" | "hotels" | "places" | "intel" | "engine", "live" | "sample">;
}
