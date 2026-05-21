import type { CatalogPackageKey, PackageCategory } from "./types";

/** Mirrors riseandshinetravel.com package listings (standalone Dubai omitted). */
export const WEBSITE_PACKAGES: {
  category: PackageCategory;
  key: CatalogPackageKey;
  name: string;
  durationNights: number;
  durationDays: number;
  sourcePath: string;
}[] = [
  { category: "domestic", key: "andaman", name: "Andaman", durationNights: 5, durationDays: 6, sourcePath: "/andaman-domestic-tour.html" },
  { category: "domestic", key: "rajasthan", name: "Rajasthan", durationNights: 8, durationDays: 9, sourcePath: "/rajasthan-domestic-tour.html" },
  { category: "domestic", key: "kerala", name: "Kerala", durationNights: 7, durationDays: 8, sourcePath: "/kerala-domestic-tour.html" },
  { category: "domestic", key: "goa", name: "Goa", durationNights: 3, durationDays: 4, sourcePath: "/goa-domestic-tour.html" },
  { category: "domestic", key: "golden-triangle", name: "Golden Triangle", durationNights: 4, durationDays: 5, sourcePath: "/golden-triangle-domestic-tour.html" },
  { category: "international", key: "thailand", name: "Thailand", durationNights: 5, durationDays: 6, sourcePath: "/thailand-international-tour.html" },
  { category: "international", key: "mauritius", name: "Mauritius", durationNights: 6, durationDays: 7, sourcePath: "/mauritius-international-tour.html" },
  { category: "international", key: "hong-kong", name: "Hong Kong", durationNights: 7, durationDays: 8, sourcePath: "/hong-kong-macau-shenzhen-international-tour.html" },
  { category: "international", key: "mauritius-dubai", name: "Mauritius & Dubai", durationNights: 7, durationDays: 8, sourcePath: "/mauritius-with-dubai-international-tour.html" },
  { category: "cruise", key: "singapore-cruise", name: "Singapore with Cruise", durationNights: 6, durationDays: 7, sourcePath: "/singapore-with-cruise-tour.html" },
  { category: "cruise", key: "singapore-bali-cruise", name: "Singapore & Bali with Cruise", durationNights: 8, durationDays: 9, sourcePath: "/singapore-bali-with-cruise-tour.html" },
];
