import { MeilisearchError } from "../lib/errors";
import { err, ok, type Result } from "../lib/result";
import type { FacetResult, Product, SearchFilterFlags, SearchParams, SearchResult } from "../types";

const BASE_URL = "https://search.central.blackheartsandsparrows.com.au";
const INDEX = "bhs_products_prod";
const API_KEY = "6cd09d74e1cace98627f7a05324bffe18b91d3925e2d372dd80acc5c739774e5";

async function postSearch(body: Record<string, unknown>): Promise<Response> {
  return fetch(`${BASE_URL}/indexes/${INDEX}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "x-meilisearch-client": "Meilisearch JavaScript (v0.50.0)",
    },
    body: JSON.stringify(body),
  });
}

export function buildDefaultFilter(warehouseCode: string): string {
  return `isActive = true AND availableWarehouseCodes = "${warehouseCode}" AND productType != "Packs"`;
}

export function buildFilter(flags: SearchFilterFlags, warehouseCode: string): string {
  const parts: string[] = [buildDefaultFilter(warehouseCode)];

  if (flags.type) {
    parts.push(`productType = "${flags.type}"`);
  }
  if (flags.region) {
    const r = flags.region;
    parts.push(
      `(region_lvl0 = "${r}" OR region_lvl1 = "${r}" OR region_lvl1 = "${r} > ${r}" OR region_lvl2 = "${r}" OR productAttributes.name = "${r}")`,
    );
  }
  if (flags.varietal) {
    const v = flags.varietal;
    parts.push(
      `(varietal_lvl0 = "${v}" OR varietal_lvl1 = "${v}" OR varietal_lvl1 = "${v} > ${v}" OR productAttributes.name = "${v}")`,
    );
  }
  if (flags["price-min"]) {
    parts.push(`price >= ${flags["price-min"]}`);
  }
  if (flags["price-max"]) {
    parts.push(`price <= ${flags["price-max"]}`);
  }
  if (flags.drinkability) {
    parts.push(`productAttributes.name = "${flags.drinkability}"`);
  }
  if (flags.body) {
    parts.push(`productAttributes.name = "${flags.body}"`);
  }
  if (flags.farming) {
    parts.push(`productAttributes.name = "${flags.farming}"`);
  }
  if (flags.dietary) {
    parts.push(`productAttributes.name = "${flags.dietary}"`);
  }
  if (flags.collection) {
    parts.push(`customCollections = "${flags.collection}"`);
  }
  if (flags["in-stock"]) {
    parts.push("isInStock = true");
  }
  if (flags.filter) {
    parts.push(flags.filter);
  }

  return parts.join(" AND ");
}

export async function searchProducts(params: SearchParams): Promise<Result<SearchResult, Error>> {
  try {
    const body: Record<string, unknown> = {
      q: params.q,
      limit: params.limit,
      offset: params.offset,
      filter: params.filter,
    };
    if (params.sort && params.sort.length > 0) {
      body.sort = params.sort;
    }
    if (params.facets && params.facets.length > 0) {
      body.facets = params.facets;
    }

    const response = await postSearch(body);
    if (!response.ok) {
      return err(new MeilisearchError(`Search failed: ${response.statusText}`, response.status));
    }

    const data = (await response.json()) as SearchResult;
    return ok(data);
  } catch (error) {
    return err(error instanceof Error ? error : new MeilisearchError(String(error)));
  }
}

export async function getProductBySku(
  sku: string,
  _warehouseCode: string,
): Promise<Result<Product, Error>> {
  try {
    const filter = `masterSku = "${sku}" AND isActive = true`;
    const response = await postSearch({ q: "", limit: 1, offset: 0, filter });
    if (!response.ok) {
      return err(
        new MeilisearchError(`Product lookup failed: ${response.statusText}`, response.status),
      );
    }

    const data = (await response.json()) as SearchResult;
    const hit = data.hits[0];
    if (!hit) {
      return err(new MeilisearchError(`No product found with SKU "${sku}"`));
    }
    return ok(hit);
  } catch (error) {
    return err(error instanceof Error ? error : new MeilisearchError(String(error)));
  }
}

export async function getFacets(
  facetNames: readonly string[],
  warehouseCode: string,
): Promise<Result<FacetResult, Error>> {
  try {
    const response = await postSearch({
      q: "",
      limit: 0,
      offset: 0,
      filter: buildDefaultFilter(warehouseCode),
      facets: facetNames,
    });
    if (!response.ok) {
      return err(
        new MeilisearchError(`Facet query failed: ${response.statusText}`, response.status),
      );
    }

    const data = (await response.json()) as FacetResult & SearchResult;
    return ok({
      facetDistribution: data.facetDistribution,
      facetStats: data.facetStats,
    });
  } catch (error) {
    return err(error instanceof Error ? error : new MeilisearchError(String(error)));
  }
}
