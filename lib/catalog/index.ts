import { ANDAMAN_PACKAGE } from "./andaman";
import { RAJASTHAN, KERALA, GOA, GOLDEN_TRIANGLE } from "./domestic-tours";
import { THAILAND, MAURITIUS, HONG_KONG, MAURITIUS_DUBAI } from "./international-tours";
import { SINGAPORE_CRUISE, SINGAPORE_BALI_CRUISE } from "./cruise-tours";
import type { CatalogPackage } from "./types";

export const CATALOG_PACKAGES = {
  andaman: ANDAMAN_PACKAGE,
  rajasthan: RAJASTHAN,
  kerala: KERALA,
  goa: GOA,
  "golden-triangle": GOLDEN_TRIANGLE,
  thailand: THAILAND,
  mauritius: MAURITIUS,
  "hong-kong": HONG_KONG,
  "mauritius-dubai": MAURITIUS_DUBAI,
  "singapore-cruise": SINGAPORE_CRUISE,
  "singapore-bali-cruise": SINGAPORE_BALI_CRUISE,
} satisfies Record<CatalogPackageKey, CatalogPackage>;

export type { CatalogPackageKey } from "./types";
import type { CatalogPackageKey } from "./types";

export const PACKAGE_LIST: CatalogPackage[] = Object.values(CATALOG_PACKAGES);

export const CATALOG_KEYS = Object.keys(CATALOG_PACKAGES) as CatalogPackageKey[];

export function isCatalogPackage(key: string): key is CatalogPackageKey {
  return key in CATALOG_PACKAGES;
}

export { ANDAMAN_PACKAGE };
export type { CatalogPackage, PackageCategory } from "./types";
