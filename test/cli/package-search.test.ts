import { describe, expect, it } from "vitest";
import { searchProductsByPackagePage } from "../../src/cli/package-search";
import { ok } from "../../src/lib/result";
import type { Product, ProductAttribute, SearchParams, SearchResult } from "../../src/types";

function makeAttributes(name: string): ProductAttribute[] {
  return [
    {
      name,
      code: "AU-VIC",
      type: "region",
      hexColor: "",
    },
  ];
}

function makeProduct(index: number, packageName: string): Product {
  const sku = `${1000 + index}`;

  return {
    id: `product-${index}`,
    objectId: `product-${index}`,
    originalId: `original-${index}`,
    name: `Product ${index}`,
    slug: `product-${index}`,
    description: "",
    masterProductType: "Wine",
    productType: "Wine",
    masterSku: sku,
    callOutPrimary: "",
    callOutSecondary: "",
    isFeaturedProduct: false,
    price: index,
    isNewProductUntil: null,
    totalAvailableQty: 12,
    isInStock: true,
    stockStatus: "IN_STOCK",
    variants: [
      {
        sku,
        packageName,
        price: index,
        quantityAvailable: 12,
        quantityInVariant: 1,
        status: "IN_STOCK",
      },
    ],
    tags: [],
    filterTags: [],
    farming: null,
    tastesLike: null,
    crush: null,
    setting: null,
    drinkability: { name: null, code: null },
    dietary: { name: null, code: null },
    style: { name: null, code: null },
    type: { name: "Wine", code: "WINE" },
    productAttributes: makeAttributes(`Region ${index}`),
    attributeCodes: [],
    coverImageUrl: "",
    source: "test",
    lastUpdated: "2026-04-25T00:00:00Z",
    varietal_lvl0: null,
    varietal_lvl1: null,
    region_lvl0: "Australia",
    region_lvl1: `Region ${index}`,
    region_lvl2: null,
    warehouses: [{ code: "311", availableQty: index }],
    isSearchableProduct: true,
    isPublicProduct: true,
    isActive: true,
    customCollections: null,
    dietaryTags: null,
    soldCount: index,
    isInHouse: false,
    stylisticChoices: null,
    availableWarehouseCodes: ["311"],
  };
}

describe("searchProductsByPackagePage", () => {
  it("scans backend pages until the requested package page is resolved", async () => {
    const products = Array.from({ length: 60 }, (_, index) =>
      makeProduct(index + 1, (index + 1) % 3 === 0 ? "Can" : "Bottle"),
    );

    const requests: SearchParams[] = [];
    const search = async (params: SearchParams) => {
      requests.push(params);

      const hits = products.slice(params.offset, params.offset + params.limit);
      return ok<SearchResult>({
        hits,
        query: params.q,
        processingTimeMs: 1,
        limit: params.limit,
        offset: params.offset,
        estimatedTotalHits: products.length,
      });
    };

    const result = await searchProductsByPackagePage({
      q: "",
      filter: 'isActive = true AND warehouses.code = "311"',
      limit: 3,
      page: 6,
      packageName: "Can",
      sort: undefined,
      warehouseCode: "311",
      search,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(requests).toHaveLength(2);
    expect(result.data.totalMatched).toBe(20);
    expect(result.data.totalPages).toBe(7);
    expect(result.data.rows.map((row) => row.masterSku)).toEqual(["1048", "1051", "1054"]);
  });
});
