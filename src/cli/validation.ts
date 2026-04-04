import { FACET_NAMES, type FacetName, type OutputFormat, type SortOption } from "../types";

const VALID_SORT_OPTIONS: readonly string[] = ["price:asc", "price:desc"];
const VALID_FORMATS: readonly string[] = ["table", "json"];

export function validateLimit(raw: string | undefined): number {
  if (raw == null) return 20;
  const n = Number(raw);
  if (Number.isNaN(n) || !Number.isInteger(n)) {
    throw new Error(`Invalid limit: "${raw}" — must be an integer`);
  }
  if (n < 1 || n > 100) {
    throw new Error(`Invalid limit: ${n} — must be between 1 and 100`);
  }
  return n;
}

export function validatePage(raw: string | undefined): number {
  if (raw == null) return 1;
  const n = Number(raw);
  if (Number.isNaN(n) || !Number.isInteger(n)) {
    throw new Error(`Invalid page: "${raw}" — must be an integer`);
  }
  if (n < 1) {
    throw new Error(`Invalid page: ${n} — must be >= 1`);
  }
  return n;
}

export function validateSort(raw: string | undefined): SortOption | undefined {
  if (raw == null) return undefined;
  const lower = raw.toLowerCase();
  if (VALID_SORT_OPTIONS.includes(lower)) {
    return lower as SortOption;
  }
  throw new Error(`Invalid sort: "${raw}" — valid options are: ${VALID_SORT_OPTIONS.join(", ")}`);
}

export function validateFormat(raw: string | undefined): OutputFormat | undefined {
  if (raw == null) return undefined;
  const lower = raw.toLowerCase();
  if (VALID_FORMATS.includes(lower)) {
    return lower as OutputFormat;
  }
  throw new Error(`Invalid format: "${raw}" — valid formats are: ${VALID_FORMATS.join(", ")}`);
}

export function validateFacetName(raw: string): FacetName {
  const lower = raw.toLowerCase();
  const match = FACET_NAMES.find((f) => f.toLowerCase() === lower);
  if (match) return match;

  const byPrefix = FACET_NAMES.find((f) => f.toLowerCase().startsWith(lower));
  if (byPrefix) return byPrefix;

  throw new Error(`Invalid facet: "${raw}" — valid facets are:\n  ${FACET_NAMES.join("\n  ")}`);
}
