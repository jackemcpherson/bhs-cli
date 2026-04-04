import { describe, expect, it } from "vitest";
import { formatTable } from "../../../src/cli/formatters/table";

describe("formatTable", () => {
  it("returns 'No results.' for empty data", () => {
    expect(formatTable([], { columns: [{ key: "name", label: "Name" }] })).toBe("No results.");
  });

  it("formats a simple table", () => {
    const data = [
      { name: "Shiraz", price: 25 },
      { name: "Pinot Noir", price: 30 },
    ];
    const columns = [
      { key: "name", label: "Name" },
      { key: "price", label: "Price" },
    ];
    const result = formatTable(data, { columns });

    expect(result).toContain("Name");
    expect(result).toContain("Price");
    expect(result).toContain("Shiraz");
    expect(result).toContain("Pinot Noir");
    expect(result).toContain("25");
    expect(result).toContain("30");
  });

  it("handles null values as '-'", () => {
    const data = [{ name: "Wine", region: null }];
    const columns = [
      { key: "name", label: "Name" },
      { key: "region", label: "Region" },
    ];
    const result = formatTable(data, { columns });
    expect(result).toContain("-");
  });

  it("respects maxWidth", () => {
    const data = [{ name: "A very long product name that should be truncated" }];
    const columns = [{ key: "name", label: "Name", maxWidth: 10 }];
    const result = formatTable(data, { columns });
    const lines = result.split("\n");
    const dataLine = lines[2];
    expect(dataLine).toBeDefined();
    expect(dataLine?.trim().length).toBeLessThanOrEqual(10);
  });
});
