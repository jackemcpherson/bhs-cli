import { describe, expect, it } from "vitest";
import { buildDefaultFilter, buildFilter } from "../../src/api/meilisearch";
import type { SearchFilterFlags } from "../../src/types";

describe("buildDefaultFilter", () => {
  it("builds the base filter with warehouse code", () => {
    const result = buildDefaultFilter("311");
    expect(result).toBe(
      'isActive = true AND availableWarehouseCodes = "311" AND productType != "Packs"',
    );
  });
});

describe("buildFilter", () => {
  const emptyFlags: SearchFilterFlags = {
    type: undefined,
    region: undefined,
    varietal: undefined,
    "price-min": undefined,
    "price-max": undefined,
    drinkability: undefined,
    body: undefined,
    farming: undefined,
    dietary: undefined,
    collection: undefined,
    "in-stock": undefined,
    filter: undefined,
  };

  it("returns only the default filter when no flags are set", () => {
    const result = buildFilter(emptyFlags, "311");
    expect(result).toBe(buildDefaultFilter("311"));
  });

  it("appends type filter", () => {
    const result = buildFilter({ ...emptyFlags, type: "Wine" }, "311");
    expect(result).toContain('AND productType = "Wine"');
  });

  it("appends region filter across all levels", () => {
    const result = buildFilter({ ...emptyFlags, region: "Yarra Valley" }, "311");
    expect(result).toContain('region_lvl0 = "Yarra Valley"');
    expect(result).toContain('region_lvl1 = "Yarra Valley"');
    expect(result).toContain('region_lvl2 = "Yarra Valley"');
  });

  it("appends price range filters", () => {
    const result = buildFilter({ ...emptyFlags, "price-min": "10", "price-max": "50" }, "311");
    expect(result).toContain("AND price >= 10");
    expect(result).toContain("AND price <= 50");
  });

  it("appends in-stock filter", () => {
    const result = buildFilter({ ...emptyFlags, "in-stock": true }, "311");
    expect(result).toContain("AND isInStock = true");
  });

  it("appends raw filter", () => {
    const result = buildFilter({ ...emptyFlags, filter: "soldCount > 100" }, "311");
    expect(result).toContain("AND soldCount > 100");
  });

  it("combines multiple filters", () => {
    const result = buildFilter(
      { ...emptyFlags, type: "Wine", region: "France", "price-max": "30" },
      "280",
    );
    expect(result).toContain('availableWarehouseCodes = "280"');
    expect(result).toContain('productType = "Wine"');
    expect(result).toContain('region_lvl0 = "France"');
    expect(result).toContain("price <= 30");
  });
});
