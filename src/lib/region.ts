import type { ProductAttribute } from "../types";

const COUNTRY_CODES = new Set([
  "AU",
  "FR",
  "IT",
  "ES",
  "PT",
  "NZ",
  "DE",
  "AT",
  "US",
  "CL",
  "AR",
  "GR",
  "JP",
  "ZA",
  "GE",
  "HU",
  "SI",
  "HR",
  "RS",
  "LB",
  "IL",
  "MX",
  "GB",
]);

function isCountry(code: string): boolean {
  return COUNTRY_CODES.has(code) || code.startsWith("PT-");
}

function isState(code: string): boolean {
  return (
    code.startsWith("AU-") ||
    code.startsWith("FR-") ||
    code.startsWith("IT-") ||
    code.startsWith("ES-") ||
    code.startsWith("NZ-") ||
    code.startsWith("US-") ||
    code.startsWith("DE-")
  );
}

const NON_REGION_CODES = new Set([
  "WINE",
  "BEER",
  "SPIRIT",
  "FOOD",
  "RED",
  "WHIW",
  "SPRK",
  "ROSE",
  "ORNG",
  "GUZ",
  "IMP",
  "CONT",
  "LITE",
  "L-M",
  "MED",
  "M-F",
  "FULL",
  "VG",
  "PARK",
  "HOUSE",
  "WARM",
  "FRESH",
  "LOFI",
  "NONE",
  "STAINLESS",
  "SEAFOOD",
  "CHIL",
  "SALINE",
  "REFRESH",
  "A-BIT-A",
  "PIZZA",
  "FIRE",
  "COUCH",
  "BBQ",
  "DINNER",
  "CLASSI",
  "ALL",
  "SOME",
  "MEDIU",
  "BALAN",
  "SOFTG",
  "YES",
  "IND",
  "AROMA",
  "OFFD",
  "ELECT",
  "NEUTR/OLD",
  "NEUTOLD",
  "LARGE",
  "A-LITT",
  "ORAN",
  "SOFT",
  "NONAL",
  "CIDER",
  "COCK",
  "VERMOUTH",
  "SAKE",
  "YUZU",
  "PICNIC",
  "ITRD",
  "ITWH",
  "ITSP",
  "FRRD",
  "FRWH",
]);

function isVarietalOrStyleCode(code: string): boolean {
  return /^[RWSBO]\d/.test(code) || /^RO\d/.test(code);
}

/**
 * Extract the best region string from product attributes.
 * Returns "Subregion, State" or "State, Country" or just "Country" depending on available data.
 */
export function extractRegion(attributes: readonly ProductAttribute[]): string {
  let country: string | undefined;
  let state: string | undefined;
  let subregion: string | undefined;

  for (const attr of attributes) {
    if (isCountry(attr.code)) {
      country = attr.name;
    } else if (isState(attr.code)) {
      state = attr.name;
    } else if (
      !NON_REGION_CODES.has(attr.code) &&
      !isVarietalOrStyleCode(attr.code) &&
      !attr.hexColor
    ) {
      subregion ??= attr.name;
    }
  }

  if (subregion && state && subregion !== state) return `${subregion}, ${state}`;
  if (subregion && country && subregion !== country) return `${subregion}, ${country}`;
  if (state && country) return `${state}, ${country}`;
  if (state) return state;
  if (country) return country;
  return "-";
}
