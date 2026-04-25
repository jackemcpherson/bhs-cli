import { MeilisearchError } from "./errors";
import type { SearchFilterFlags } from "../../types";

function quoteFilterValue(value: string): string {
  return JSON.stringify(value);
}

export function parsePriceFilter(name: "price-min" | "price-max", raw: string): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new MeilisearchError(`Invalid ${name}: "${raw}" must be a non-negative number`);
  }

  return parsed;
}

export function validateRawFilter(filter: string): string {
  if (!/^[\p{L}\p{N}\s_."'<>=!:[\](),-]+$/u.test(filter)) {
    throw new MeilisearchError(
      "Invalid raw filter: only letters, numbers, spaces, quotes, brackets, commas, colons, and comparison operators are allowed",
    );
  }

  return filter;
}

export function buildDefaultFilter(warehouseCode: string): string {
  return `isActive = true AND warehouses.code = "${warehouseCode}" AND productType != "Packs"`;
}

export function buildFilter(flags: SearchFilterFlags, warehouseCode: string): string {
  const parts: string[] = [buildDefaultFilter(warehouseCode)];

  if (flags.type) {
    parts.push(`productType = ${quoteFilterValue(flags.type)}`);
  }
  if (flags.country) {
    parts.push(`region_lvl0 = ${quoteFilterValue(flags.country)}`);
  }
  if (flags.region) {
    parts.push(`productAttributes.name = ${quoteFilterValue(flags.region)}`);
  }
  if (flags.varietal) {
    parts.push(`productAttributes.name = ${quoteFilterValue(flags.varietal)}`);
  }
  if (flags["price-min"]) {
    parts.push(`price >= ${parsePriceFilter("price-min", flags["price-min"])}`);
  }
  if (flags["price-max"]) {
    parts.push(`price <= ${parsePriceFilter("price-max", flags["price-max"])}`);
  }
  if (flags.drinkability) {
    parts.push(`drinkability.name = ${quoteFilterValue(flags.drinkability)}`);
  }
  if (flags.body) {
    parts.push(`body.name = ${quoteFilterValue(flags.body)}`);
  }
  if (flags.farming) {
    parts.push(`farming = ${quoteFilterValue(flags.farming)}`);
  }
  if (flags.dietary) {
    parts.push(`dietary.name = ${quoteFilterValue(flags.dietary)}`);
  }
  if (flags.collection) {
    parts.push(`customCollections = ${quoteFilterValue(flags.collection)}`);
  }
  // Note: in-stock filtering is handled as a client-side post-filter in the
  // search service, because Meilisearch cannot filter on nested array fields
  // (warehouses[code=X AND availableQty > 0]). The global isInStock flag is
  // unreliable — it disagrees with per-warehouse availableQty.
  if (flags.filter) {
    parts.push(validateRawFilter(flags.filter));
  }

  return parts.join(" AND ");
}
