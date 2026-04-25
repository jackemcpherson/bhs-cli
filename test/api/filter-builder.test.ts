import { describe, expect, it } from "vitest";
import { buildDefaultFilter, buildFilter } from "../../src/api/meilisearch";
import type { SearchFilterFlags } from "../../src/types";

describe("buildDefaultFilter", () => {
  it("builds the base filter with warehouse code", () => {
    const result = buildDefaultFilter("311");
    expect(result).toBe('isActive = true AND warehouses.code = "311" AND productType != "Packs"');
  });
});

describe("buildFilter", () => {
  const emptyFlags: SearchFilterFlags = {
    type: undefined,
    country: undefined,
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

  it("appends country filter using region_lvl0", () => {
    const result = buildFilter({ ...emptyFlags, country: "France" }, "311");
    expect(result).toContain('AND region_lvl0 = "France"');
  });

  it("appends region filter using productAttributes.name", () => {
    const result = buildFilter({ ...emptyFlags, region: "Yarra Valley" }, "311");
    expect(result).toContain('AND productAttributes.name = "Yarra Valley"');
  });

  it("appends varietal filter using productAttributes.name", () => {
    const result = buildFilter({ ...emptyFlags, varietal: "Pinot Noir" }, "311");
    expect(result).toContain('AND productAttributes.name = "Pinot Noir"');
  });

  it("appends body filter using body.name", () => {
    const result = buildFilter({ ...emptyFlags, body: "Medium" }, "311");
    expect(result).toContain('AND body.name = "Medium"');
  });

  it("appends drinkability filter using drinkability.name", () => {
    const result = buildFilter({ ...emptyFlags, drinkability: "Guzzle" }, "311");
    expect(result).toContain('AND drinkability.name = "Guzzle"');
  });

  it("appends dietary filter using dietary.name", () => {
    const result = buildFilter({ ...emptyFlags, dietary: "Vegan" }, "311");
    expect(result).toContain('AND dietary.name = "Vegan"');
  });

  it("appends farming filter using top-level farming field", () => {
    const result = buildFilter({ ...emptyFlags, farming: "Organic" }, "311");
    expect(result).toContain('AND farming = "Organic"');
  });

  it("appends price range filters", () => {
    const result = buildFilter({ ...emptyFlags, "price-min": "10", "price-max": "50" }, "311");
    expect(result).toContain("AND price >= 10");
    expect(result).toContain("AND price <= 50");
  });

  it("does not append in-stock to Meilisearch filter (handled as post-filter)", () => {
    const result = buildFilter({ ...emptyFlags, "in-stock": true }, "311");
    expect(result).not.toContain("isInStock");
  });

  it("appends raw filter", () => {
    const result = buildFilter({ ...emptyFlags, filter: "soldCount > 100" }, "311");
    expect(result).toContain("AND soldCount > 100");
  });

  it("escapes quoted string values", () => {
    const result = buildFilter({ ...emptyFlags, varietal: 'Pinot "Noir"' }, "311");
    expect(result).toContain('AND productAttributes.name = "Pinot \\"Noir\\""');
  });

  it("throws on invalid numeric price filters", () => {
    expect(() => buildFilter({ ...emptyFlags, "price-min": "cheap" }, "311")).toThrow(
      'Invalid price-min: "cheap"',
    );
  });

  it("throws on unsupported raw filter characters", () => {
    expect(() => buildFilter({ ...emptyFlags, filter: "soldCount > 100; DROP" }, "311")).toThrow(
      "Invalid raw filter",
    );
  });

  it("combines multiple filters", () => {
    const result = buildFilter(
      { ...emptyFlags, type: "Wine", country: "France", region: "Burgundy", "price-max": "30" },
      "280",
    );
    expect(result).toContain('warehouses.code = "280"');
    expect(result).toContain('productType = "Wine"');
    expect(result).toContain('region_lvl0 = "France"');
    expect(result).toContain('productAttributes.name = "Burgundy"');
    expect(result).toContain("price <= 30");
  });
});
