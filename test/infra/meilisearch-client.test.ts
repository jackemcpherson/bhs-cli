import { describe, expect, it } from "vitest";
import { ValidationError } from "../../src/core/domain/errors";
import { createMeilisearchClient } from "../../src/infra/bhs/meilisearch-client";

function makeProduct() {
  return {
    id: "1",
    objectId: "1",
    originalId: "1",
    name: "Test Wine",
    slug: "test-wine",
    description: "",
    masterProductType: "Wine",
    productType: "Wine",
    masterSku: "SKU1",
    callOutPrimary: "",
    callOutSecondary: "",
    isFeaturedProduct: false,
    price: 25,
    isNewProductUntil: null,
    totalAvailableQty: 10,
    isInStock: true,
    stockStatus: "IN_STOCK",
    variants: [
      {
        sku: "SKU1",
        packageName: "Bottle",
        price: 25,
        quantityAvailable: 10,
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
    productAttributes: [],
    attributeCodes: [],
    coverImageUrl: "",
    source: "test",
    lastUpdated: "2026-04-25T00:00:00Z",
    varietal_lvl0: null,
    varietal_lvl1: null,
    region_lvl0: null,
    region_lvl1: null,
    region_lvl2: null,
    warehouses: [{ code: "311", availableQty: 10 }],
    isSearchableProduct: true,
    isPublicProduct: true,
    isActive: true,
    customCollections: null,
    dietaryTags: null,
    soldCount: 0,
    isInHouse: false,
    stylisticChoices: null,
    availableWarehouseCodes: ["311"],
  };
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("createMeilisearchClient", () => {
  it("validates search payloads and honors injected fetch", async () => {
    const requests: string[] = [];
    const client = createMeilisearchClient({
      baseUrl: "https://search.example.test",
      index: "products",
      apiKey: "secret",
      fetchFn: async (input) => {
        requests.push(String(input));
        return jsonResponse({
          hits: [makeProduct()],
          query: "",
          processingTimeMs: 1,
          limit: 1,
          offset: 0,
          estimatedTotalHits: 1,
        });
      },
    });

    const result = await client.searchProducts({
      q: "",
      limit: 1,
      offset: 0,
      filter: "isActive = true",
      sort: undefined,
      facets: undefined,
    });

    expect(result.success).toBe(true);
    expect(requests).toEqual(["https://search.example.test/indexes/products/search"]);
  });

  it("returns ValidationError on malformed search payloads", async () => {
    const client = createMeilisearchClient({
      fetchFn: async () => jsonResponse({ hits: [{ id: "1" }] }),
    });

    const result = await client.searchProducts({
      q: "",
      limit: 1,
      offset: 0,
      filter: "isActive = true",
      sort: undefined,
      facets: undefined,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeInstanceOf(ValidationError);
  });

  it("maps transport failures to MeilisearchError", async () => {
    const client = createMeilisearchClient({
      fetchFn: async () => new Response("bad", { status: 503, statusText: "Unavailable" }),
    });

    const result = await client.searchProducts({
      q: "",
      limit: 1,
      offset: 0,
      filter: "isActive = true",
      sort: undefined,
      facets: undefined,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.name).toBe("MeilisearchError");
  });
});
