import type {
  Flights,
  Hotel,
  Intel,
  NarrativeActivity,
  VisaInfo,
} from "@/lib/itinerary/schema";

export type PackageCategory = "domestic" | "international" | "cruise";

export type CatalogPackageKey =
  | "andaman"
  | "rajasthan"
  | "kerala"
  | "goa"
  | "golden-triangle"
  | "thailand"
  | "mauritius"
  | "hong-kong"
  | "mauritius-dubai"
  | "singapore-cruise"
  | "singapore-bali-cruise";

export interface CatalogPackageMeta {
  key: CatalogPackageKey;
  category: PackageCategory;
  name: string;
  title: string;
  tagline: string;
  tourName: string;
  durationNights: number;
  durationDays: number;
  routeSummary: string;
  heroImageUrl: string;
  originAirport: string;
  arrivalAirport: string;
  flightRouteLabel: string;
  domestic: boolean;
}

export interface CatalogDayTemplate {
  dayIndex: number;
  cityLabel: string;
  headline: string;
  overnight: string;
  activities: NarrativeActivity[];
}

export interface CatalogPackage extends CatalogPackageMeta {
  narrativeDays: CatalogDayTemplate[];
  flights: Flights;
  hotels: Hotel[];
  visa: VisaInfo | null;
  intel: Intel;
  /** Build pricing from these INR benchmarks (converted to USD in build). */
  pricingINR: {
    flightPerAdult: number;
    hotels: { nightly: number; nights: number }[];
    transfersPerPax: number;
    activitiesPerPax: number;
    insurancePerPax: number;
    servicePct: number;
  };
}
