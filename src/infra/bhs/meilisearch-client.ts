import { MeilisearchError } from "../../core/domain/errors";
import { buildDefaultFilter } from "../../core/domain/filters";
import {
  ProductSchema,
  SearchResultSchema,
  SearchWithFacetsSchema,
} from "../../core/schemas/meilisearch";
import { err, ok, type Result } from "../../lib/result";
import type { FacetResult, Product, SearchParams, SearchResult } from "../../types";
import {
  DEFAULT_MEILISEARCH_API_KEY,
  DEFAULT_MEILISEARCH_BASE_URL,
  DEFAULT_MEILISEARCH_INDEX,
} from "./defaults";
import { resolveFetch, validateResult } from "./http";

export interface MeilisearchClientOptions {
  fetchFn?: typeof fetch;
  baseUrl: string;
  index: string;
  apiKey?: string;
}

export interface MeilisearchClient {
  searchProducts(params: SearchParams): Promise<Result<SearchResult, Error>>;
  getProductBySku(sku: string): Promise<Result<Product, Error>>;
  getFacets(
    facetNames: readonly string[],
    warehouseCode: string,
  ): Promise<Result<FacetResult, Error>>;
}

function defaultMeilisearchClientOptions(
  options?: Partial<MeilisearchClientOptions>,
): MeilisearchClientOptions {
  return {
    baseUrl: options?.baseUrl ?? DEFAULT_MEILISEARCH_BASE_URL,
    index: options?.index ?? DEFAULT_MEILISEARCH_INDEX,
    ...(options?.fetchFn ? { fetchFn: options.fetchFn } : {}),
    ...(options?.apiKey !== undefined
      ? { apiKey: options.apiKey }
      : { apiKey: DEFAULT_MEILISEARCH_API_KEY }),
  };
}

export function createMeilisearchClient(
  options?: Partial<MeilisearchClientOptions>,
): MeilisearchClient {
  const resolved = defaultMeilisearchClientOptions(options);
  const fetchFn = resolveFetch(resolved.fetchFn);

  async function postSearch(body: Record<string, unknown>): Promise<Result<unknown, Error>> {
    try {
      const response = await fetchFn(`${resolved.baseUrl}/indexes/${resolved.index}/search`, {
        method: "POST",
        headers: {
          ...(resolved.apiKey ? { Authorization: `Bearer ${resolved.apiKey}` } : {}),
          "Content-Type": "application/json",
          "x-meilisearch-client": "Meilisearch JavaScript (v0.50.0)",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return err(
          new MeilisearchError(`Search failed: ${response.statusText}`, {
            statusCode: response.status,
          }),
        );
      }

      return ok(await response.json());
    } catch (error) {
      return err(
        new MeilisearchError(String(error instanceof Error ? error.message : error), {
          cause: error,
        }),
      );
    }
  }

  return {
    async searchProducts(params: SearchParams) {
      const body: Record<string, unknown> = {
        q: params.q,
        limit: params.limit,
        offset: params.offset,
        filter: params.filter,
      };
      if (params.sort && params.sort.length > 0) body.sort = params.sort;
      if (params.facets && params.facets.length > 0) body.facets = params.facets;

      const result = await postSearch(body);
      return validateResult<SearchResult>(
        result,
        (input) => SearchResultSchema.parse(input),
        "Meilisearch search",
      );
    },

    async getProductBySku(sku: string) {
      const result = await postSearch({
        q: "",
        limit: 1,
        offset: 0,
        filter: `masterSku = ${JSON.stringify(sku)} AND isActive = true`,
      });
      const validated = await validateResult<SearchResult>(
        result,
        (input) => SearchResultSchema.parse(input),
        "Meilisearch product",
      );
      if (!validated.success) return validated;

      const hit = validated.data.hits[0];
      if (!hit) {
        return err(new MeilisearchError(`No product found with SKU "${sku}"`));
      }

      return ok<Product>(ProductSchema.parse(hit));
    },

    async getFacets(facetNames: readonly string[], warehouseCode: string) {
      const result = await postSearch({
        q: "",
        limit: 0,
        offset: 0,
        filter: buildDefaultFilter(warehouseCode),
        facets: facetNames,
      });
      const validated = await validateResult(
        result,
        (input) => SearchWithFacetsSchema.parse(input),
        "Meilisearch facets",
      );
      if (!validated.success) return validated;

      return ok<FacetResult>({
        facetDistribution: validated.data.facetDistribution,
        facetStats: validated.data.facetStats ?? undefined,
      });
    },
  };
}
