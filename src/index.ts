export { fetchStores } from "./api/graphql";
export {
  buildDefaultFilter,
  buildFilter,
  getFacets,
  getProductBySku,
  searchProducts,
} from "./api/meilisearch";
export { ConfigError, GraphQLError, MeilisearchError } from "./lib/errors";
export type { Err, Ok, Result } from "./lib/result";
export { err, ok } from "./lib/result";
export type {
  BhsConfig,
  FacetName,
  FacetResult,
  OutputFormat,
  Product,
  ProductAttribute,
  ProductNamedField,
  ProductVariant,
  ProductWarehouse,
  SearchFilterFlags,
  SearchParams,
  SearchResult,
  SortOption,
  Store,
} from "./types";
export { FACET_NAMES } from "./types";
