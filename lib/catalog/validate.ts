import { CATALOG_PACKAGES, PACKAGE_LIST } from "./index";
import { WEBSITE_PACKAGES } from "./manifest";

export function validateCatalog(): string[] {
  const errors: string[] = [];

  if (PACKAGE_LIST.length !== WEBSITE_PACKAGES.length) {
    errors.push(
      `Package count mismatch: catalog has ${PACKAGE_LIST.length}, website lists ${WEBSITE_PACKAGES.length}`,
    );
  }

  for (const expected of WEBSITE_PACKAGES) {
    const pkg = CATALOG_PACKAGES[expected.key];
    if (!pkg) {
      errors.push(`Missing package: ${expected.key}`);
      continue;
    }
    if (pkg.category !== expected.category) {
      errors.push(`${expected.key}: category ${pkg.category} !== ${expected.category}`);
    }
    if (pkg.durationNights !== expected.durationNights) {
      errors.push(
        `${expected.key}: nights ${pkg.durationNights} !== ${expected.durationNights}`,
      );
    }
    if (pkg.durationDays !== expected.durationDays) {
      errors.push(
        `${expected.key}: days ${pkg.durationDays} !== ${expected.durationDays}`,
      );
    }
    if (pkg.narrativeDays.length !== expected.durationDays) {
      errors.push(
        `${expected.key}: ${pkg.narrativeDays.length} narrative days !== ${expected.durationDays} expected`,
      );
    }
    for (const d of pkg.narrativeDays) {
      for (const a of d.activities) {
        if (!a.title.trim() || !a.detail.trim()) {
          errors.push(`${expected.key} day ${d.dayIndex + 1}: empty activity text`);
        }
      }
    }
  }

  return errors;
}
