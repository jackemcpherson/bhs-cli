import { z } from "zod";

const ProductVariantSchema = z.object({
  sku: z.string(),
  packageName: z.string(),
  price: z.number(),
  quantityAvailable: z.number(),
  quantityInVariant: z.number(),
  status: z.string(),
});

const ProductAttributeSchema = z.object({
  name: z.string(),
  code: z.string(),
  type: z.string(),
  hexColor: z.string(),
});

const ProductWarehouseSchema = z.object({
  code: z.string(),
  availableQty: z.number(),
});

const ProductNamedFieldSchema = z.object({
  name: z.string().nullable(),
  code: z.string().nullable(),
});

export const ProductSchema = z.object({
  id: z.string(),
  objectId: z.string(),
  originalId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  masterProductType: z.string(),
  productType: z.string(),
  masterSku: z.string(),
  callOutPrimary: z.string(),
  callOutSecondary: z.string(),
  isFeaturedProduct: z.boolean(),
  price: z.number(),
  isNewProductUntil: z.string().nullable(),
  totalAvailableQty: z.number(),
  isInStock: z.boolean(),
  stockStatus: z.string(),
  variants: z.array(ProductVariantSchema),
  tags: z.array(z.string()),
  filterTags: z.array(z.string()),
  farming: z.union([z.string(), z.array(z.string())]).nullable(),
  tastesLike: z.string().nullable(),
  crush: z.string().nullable(),
  setting: z.string().nullable(),
  drinkability: ProductNamedFieldSchema,
  dietary: ProductNamedFieldSchema,
  style: ProductNamedFieldSchema,
  type: ProductNamedFieldSchema,
  productAttributes: z.array(ProductAttributeSchema),
  attributeCodes: z.array(z.string()),
  coverImageUrl: z.string(),
  source: z.string(),
  lastUpdated: z.string(),
  varietal_lvl0: z.string().nullable(),
  varietal_lvl1: z.string().nullable(),
  region_lvl0: z.string().nullish(),
  region_lvl1: z.string().nullish(),
  region_lvl2: z.string().nullish(),
  warehouses: z.array(ProductWarehouseSchema),
  isSearchableProduct: z.boolean(),
  isPublicProduct: z.boolean(),
  isActive: z.boolean(),
  customCollections: z.array(z.string()).nullable(),
  dietaryTags: z.union([z.string(), z.array(z.string())]).nullable(),
  soldCount: z.number(),
  isInHouse: z.boolean(),
  stylisticChoices: z.union([z.string(), z.array(z.string())]).nullable(),
  availableWarehouseCodes: z.array(z.string()),
});

export const SearchResultSchema = z.object({
  hits: z.array(ProductSchema),
  query: z.string(),
  processingTimeMs: z.number(),
  limit: z.number(),
  offset: z.number(),
  estimatedTotalHits: z.number(),
});

export const FacetResultSchema = z.object({
  facetDistribution: z.record(z.string(), z.record(z.string(), z.number())),
  facetStats: z.record(z.string(), z.object({ min: z.number(), max: z.number() })).optional(),
});

export const SearchWithFacetsSchema = SearchResultSchema.extend({
  facetDistribution: FacetResultSchema.shape.facetDistribution,
  facetStats: FacetResultSchema.shape.facetStats,
});
