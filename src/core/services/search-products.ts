import { buildFilter } from "../domain/filters";
import { toPackageSearchRow, toProductSearchRow, type ProductSearchRow } from "../domain/product-view";
import { ok, type Result } from "../../lib/result";
import type { Product, SearchFilterFlags, SearchParams, SearchResult, SortOption } from "../../types";

interface SearchApi {
  searchProducts(params: SearchParams): Promise<Result<SearchResult, Error>>;
}

export interface SearchProductsDependencies {
  readonly client: SearchApi;
}

export interface SearchProductsInput {
  readonly q: string;
  readonly warehouseCode: string;
  readonly filterFlags: SearchFilterFlags;
  readonly limit: number;
  readonly page: number;
  readonly packageName: string | undefined;
  readonly sort: SortOption | undefined;
}

export interface SearchProductsViewModel {
  readonly rows: readonly ProductSearchRow[];
  readonly totalMatched: number;
  readonly totalPages: number;
  readonly summary: string;
  readonly includesPackageColumn: boolean;
}

function hasStockAtWarehouse(hit: Product, warehouseCode: string): boolean {
  const warehouse = hit.warehouses.find((w) => w.code === warehouseCode);
  return warehouse !== undefined && warehouse.availableQty > 0;
}

export async function searchProductsService(
  deps: SearchProductsDependencies,
  input: SearchProductsInput,
): Promise<Result<SearchProductsViewModel, Error>> {
  const filter = buildFilter(input.filterFlags, input.warehouseCode);
  const sort = input.sort ? [input.sort] : undefined;
  const needsPostFilter = input.packageName !== undefined || input.filterFlags["in-stock"] === true;

  if (needsPostFilter) {
    const result = await searchWithPostFilter({
      q: input.q,
      filter,
      limit: input.limit,
      page: input.page,
      packageName: input.packageName,
      inStock: input.filterFlags["in-stock"] === true,
      sort,
      warehouseCode: input.warehouseCode,
      search: (params) => deps.client.searchProducts(params),
    });
    if (!result.success) return result;

    const label = input.packageName
      ? `products with "${input.packageName}"`
      : "in-stock products";

    return ok({
      rows: result.data.rows,
      totalMatched: result.data.totalMatched,
      totalPages: result.data.totalPages,
      summary:
        result.data.totalPages === 0
          ? `Found 0 ${label}`
          : `Found ${result.data.totalMatched} ${label} (page ${input.page} of ${result.data.totalPages})`,
      includesPackageColumn: input.packageName !== undefined,
    });
  }

  const offset = (input.page - 1) * input.limit;
  const result = await deps.client.searchProducts({
    q: input.q,
    limit: input.limit,
    offset,
    filter,
    sort,
    facets: undefined,
  });
  if (!result.success) return result;

  const totalPages =
    result.data.estimatedTotalHits === 0 ? 0 : Math.ceil(result.data.estimatedTotalHits / input.limit);

  return ok({
    rows: result.data.hits.map((hit) => toProductSearchRow(hit, input.warehouseCode)),
    totalMatched: result.data.estimatedTotalHits,
    totalPages,
    summary:
      totalPages === 0
        ? "Found 0 products"
        : `Found ${result.data.estimatedTotalHits} products (page ${input.page} of ${totalPages})`,
    includesPackageColumn: false,
  });
}

interface PostFilterSearchOptions {
  readonly filter: string;
  readonly limit: number;
  readonly page: number;
  readonly packageName: string | undefined;
  readonly inStock: boolean;
  readonly q: string;
  readonly sort: readonly string[] | undefined;
  readonly warehouseCode: string;
  readonly search: (params: SearchParams) => Promise<Result<SearchResult, Error>>;
}

interface PostFilterSearchPage {
  readonly rows: readonly ProductSearchRow[];
  readonly totalMatched: number;
  readonly totalPages: number;
}

const MAX_POST_FILTER_OFFSET = 10_000;

export async function searchWithPostFilter(
  options: PostFilterSearchOptions,
): Promise<Result<PostFilterSearchPage, Error>> {
  const start = (options.page - 1) * options.limit;
  const end = start + options.limit;
  const chunkSize = Math.min(100, Math.max(options.limit * 3, 50));

  const rows: ProductSearchRow[] = [];
  let matchedCount = 0;
  let offset = 0;
  let estimatedTotalHits = Number.POSITIVE_INFINITY;

  while (offset < estimatedTotalHits && offset < MAX_POST_FILTER_OFFSET) {
    const result = await options.search({
      q: options.q,
      limit: chunkSize,
      offset,
      filter: options.filter,
      sort: options.sort,
      facets: undefined,
    });

    if (!result.success) return result;

    const { hits, estimatedTotalHits: totalHits } = result.data;
    estimatedTotalHits = totalHits;

    if (hits.length === 0) break;

    for (const hit of hits) {
      if (options.inStock && !hasStockAtWarehouse(hit, options.warehouseCode)) {
        continue;
      }

      let row: ProductSearchRow | undefined;
      if (options.packageName) {
        row = toPackageSearchRow(hit, options.packageName, options.warehouseCode);
        if (!row) continue;
      } else {
        row = toProductSearchRow(hit, options.warehouseCode);
      }

      if (matchedCount >= start && matchedCount < end) {
        rows.push(row);
      }

      matchedCount += 1;
    }

    offset += hits.length;
    if (hits.length < chunkSize) break;
  }

  return ok({
    rows,
    totalMatched: matchedCount,
    totalPages: matchedCount === 0 ? 0 : Math.ceil(matchedCount / options.limit),
  });
}
