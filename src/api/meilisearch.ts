import { buildDefaultFilter, buildFilter } from "../core/domain/filters";
import { createMeilisearchClient } from "../infra/bhs/meilisearch-client";
import type { Result } from "../lib/result";
import type { FacetResult, Product, SearchParams, SearchResult } from "../types";

const client = createMeilisearchClient();

export { buildDefaultFilter, buildFilter };

export async function searchProducts(params: SearchParams): Promise<Result<SearchResult, Error>> {
  return client.searchProducts(params);
}

export async function getProductBySku(
  sku: string,
  _warehouseCode: string,
): Promise<Result<Product, Error>> {
  return client.getProductBySku(sku);
}

export async function getFacets(
  facetNames: readonly string[],
  warehouseCode: string,
): Promise<Result<FacetResult, Error>> {
  return client.getFacets(facetNames, warehouseCode);
}
