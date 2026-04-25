export interface ProductVariant {
  readonly sku: string;
  readonly packageName: string;
  readonly price: number;
  readonly quantityAvailable: number;
  readonly quantityInVariant: number;
  readonly status: string;
}

export interface ProductAttribute {
  readonly name: string;
  readonly code: string;
  readonly type: string;
  readonly hexColor: string;
}

export interface ProductWarehouse {
  readonly code: string;
  readonly availableQty: number;
}

export interface ProductNamedField {
  readonly name: string | null;
  readonly code: string | null;
}

export interface Product {
  readonly id: string;
  readonly objectId: string;
  readonly originalId: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly masterProductType: string;
  readonly productType: string;
  readonly masterSku: string;
  readonly callOutPrimary: string;
  readonly callOutSecondary: string;
  readonly isFeaturedProduct: boolean;
  readonly price: number;
  readonly isNewProductUntil: string | null;
  readonly totalAvailableQty: number;
  readonly isInStock: boolean;
  readonly stockStatus: string;
  readonly variants: readonly ProductVariant[];
  readonly tags: readonly string[];
  readonly filterTags: readonly string[];
  readonly farming: string | readonly string[] | null;
  readonly tastesLike: string | null;
  readonly crush: string | null;
  readonly setting: string | null;
  readonly drinkability: ProductNamedField;
  readonly dietary: ProductNamedField;
  readonly style: ProductNamedField;
  readonly type: ProductNamedField;
  readonly productAttributes: readonly ProductAttribute[];
  readonly attributeCodes: readonly string[];
  readonly coverImageUrl: string;
  readonly source: string;
  readonly lastUpdated: string;
  readonly varietal_lvl0: string | null;
  readonly varietal_lvl1: string | null;
  readonly region_lvl0?: string | null | undefined;
  readonly region_lvl1?: string | null | undefined;
  readonly region_lvl2?: string | null | undefined;
  readonly warehouses: readonly ProductWarehouse[];
  readonly isSearchableProduct: boolean;
  readonly isPublicProduct: boolean;
  readonly isActive: boolean;
  readonly customCollections: readonly string[] | null;
  readonly dietaryTags: string | readonly string[] | null;
  readonly soldCount: number;
  readonly isInHouse: boolean;
  readonly stylisticChoices: string | readonly string[] | null;
  readonly availableWarehouseCodes: readonly string[];
}

export interface Store {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly postCode: string | null;
  readonly warehouseCode: string;
  readonly address: string | null;
  readonly phone: string | null;
  readonly allowCNC: boolean | null;
}

export interface BhsConfig {
  readonly store: {
    readonly code: string;
    readonly name: string;
  };
}

export interface SearchParams {
  readonly q: string;
  readonly limit: number;
  readonly offset: number;
  readonly filter: string;
  readonly sort: readonly string[] | undefined;
  readonly facets: readonly string[] | undefined;
}

export interface SearchResult {
  readonly hits: readonly Product[];
  readonly query: string;
  readonly processingTimeMs: number;
  readonly limit: number;
  readonly offset: number;
  readonly estimatedTotalHits: number;
}

export interface FacetResult {
  readonly facetDistribution: Record<string, Record<string, number>>;
  readonly facetStats: Record<string, { min: number; max: number }> | undefined;
}

export interface LineItemDiscount {
  readonly discountName: string;
  readonly discountAmount: number;
  readonly discountedItemPrice: number;
}

export interface LineItem {
  readonly id: string;
  readonly masterSku: string;
  readonly sku: string;
  readonly quantity: number;
  readonly title: string;
  readonly packageName: string;
  readonly productType: string;
  readonly singlePrice: number;
  readonly discountedPrice: number;
  readonly discounts: readonly LineItemDiscount[];
}

export interface Checkout {
  readonly uid: string;
  readonly status: string;
  readonly subtotal: number;
  readonly discountedSubtotal: number;
  readonly gst: number;
  readonly total: number;
  readonly lineItems: readonly LineItem[];
}

export interface LineItemInput {
  readonly sku: string;
  readonly masterSku: string;
  readonly quantity: number;
}

export type SortOption = "price:asc" | "price:desc";

export type OutputFormat = "table" | "json";

export const FACET_NAMES = [
  "varietal_lvl0",
  "varietal_lvl1",
  "drinkability.name",
  "region_lvl0",
  "region_lvl1",
  "region_lvl2",
  "customCollections",
  "body.name",
  "farming",
  "dietaryTags",
  "type.name",
  "stylisticChoices",
] as const;

export type FacetName = (typeof FACET_NAMES)[number];

export interface SearchFilterFlags {
  readonly type: string | undefined;
  readonly country: string | undefined;
  readonly region: string | undefined;
  readonly varietal: string | undefined;
  readonly "price-min": string | undefined;
  readonly "price-max": string | undefined;
  readonly drinkability: string | undefined;
  readonly body: string | undefined;
  readonly farming: string | undefined;
  readonly dietary: string | undefined;
  readonly collection: string | undefined;
  readonly "in-stock": boolean | undefined;
  readonly filter: string | undefined;
}
