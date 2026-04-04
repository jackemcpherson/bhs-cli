import { describe, expect, it } from "vitest";
import {
  validateFacetName,
  validateFormat,
  validateLimit,
  validatePage,
  validateSort,
} from "../../src/cli/validation";

describe("validateLimit", () => {
  it("returns 20 when undefined", () => {
    expect(validateLimit(undefined)).toBe(20);
  });

  it("parses a valid integer", () => {
    expect(validateLimit("50")).toBe(50);
  });

  it("throws on non-integer", () => {
    expect(() => validateLimit("abc")).toThrow("Invalid limit");
  });

  it("throws on out-of-range", () => {
    expect(() => validateLimit("0")).toThrow("must be between 1 and 100");
    expect(() => validateLimit("101")).toThrow("must be between 1 and 100");
  });
});

describe("validatePage", () => {
  it("returns 1 when undefined", () => {
    expect(validatePage(undefined)).toBe(1);
  });

  it("parses a valid integer", () => {
    expect(validatePage("3")).toBe(3);
  });

  it("throws on negative", () => {
    expect(() => validatePage("0")).toThrow("must be >= 1");
  });
});

describe("validateSort", () => {
  it("returns undefined when undefined", () => {
    expect(validateSort(undefined)).toBeUndefined();
  });

  it("accepts price:asc", () => {
    expect(validateSort("price:asc")).toBe("price:asc");
  });

  it("accepts price:desc", () => {
    expect(validateSort("price:desc")).toBe("price:desc");
  });

  it("throws on invalid sort", () => {
    expect(() => validateSort("name")).toThrow("Invalid sort");
  });
});

describe("validateFormat", () => {
  it("returns undefined when undefined", () => {
    expect(validateFormat(undefined)).toBeUndefined();
  });

  it("accepts table", () => {
    expect(validateFormat("table")).toBe("table");
  });

  it("accepts json", () => {
    expect(validateFormat("json")).toBe("json");
  });

  it("throws on invalid format", () => {
    expect(() => validateFormat("xml")).toThrow("Invalid format");
  });
});

describe("validateFacetName", () => {
  it("accepts exact match", () => {
    expect(validateFacetName("region_lvl0")).toBe("region_lvl0");
  });

  it("accepts case-insensitive match", () => {
    expect(validateFacetName("Region_Lvl0")).toBe("region_lvl0");
  });

  it("accepts prefix match", () => {
    expect(validateFacetName("region")).toBe("region_lvl0");
  });

  it("throws on unknown facet", () => {
    expect(() => validateFacetName("nonexistent")).toThrow("Invalid facet");
  });
});
