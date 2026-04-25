import { defineCommand } from "citty";
import type { SearchFilterFlags } from "../../types";
import {
  LIMIT_FLAG,
  OUTPUT_FLAGS,
  PACKAGE_FLAG,
  PAGE_FLAG,
  SEARCH_FILTER_FLAGS,
  SORT_FLAG,
  STORE_FLAG,
} from "../flags";
import { type FormatOptions, formatOutput } from "../formatters/index";
import { nodeRuntime } from "../node-runtime";
import { showSummary, withSpinner } from "../ui";
import { validateLimit, validatePage, validateSort } from "../validation";

const SEARCH_COLUMNS = [
  { key: "masterSku", label: "SKU", maxWidth: 8 },
  { key: "name", label: "Name", maxWidth: 40 },
  { key: "displayPrice", label: "Price", maxWidth: 10 },
  { key: "displayPackage", label: "Package", maxWidth: 14 },
  { key: "stock", label: "Stock", maxWidth: 6 },
  { key: "productType", label: "Type", maxWidth: 15 },
  { key: "displayRegion", label: "Region", maxWidth: 20 },
] as const;

const SEARCH_COLUMNS_NO_PACKAGE = [
  { key: "masterSku", label: "SKU", maxWidth: 8 },
  { key: "name", label: "Name", maxWidth: 40 },
  { key: "displayPrice", label: "Price", maxWidth: 8 },
  { key: "stock", label: "Stock", maxWidth: 6 },
  { key: "productType", label: "Type", maxWidth: 15 },
  { key: "displayRegion", label: "Region", maxWidth: 20 },
] as const;

export const searchCommand = defineCommand({
  meta: {
    name: "search",
    description: "Search for products",
  },
  args: {
    query: {
      type: "positional",
      description: "Search query",
      required: false,
      default: "",
    },
    ...OUTPUT_FLAGS,
    ...STORE_FLAG,
    ...LIMIT_FLAG,
    ...PAGE_FLAG,
    ...SORT_FLAG,
    ...PACKAGE_FLAG,
    ...SEARCH_FILTER_FLAGS,
  },
  run: async ({ args }) => {
    const configResult = await nodeRuntime.services.resolveStore(args.store);
    if (!configResult.success) throw configResult.error;

    const filterFlags: SearchFilterFlags = {
      type: args.type,
      country: args.country,
      region: args.region,
      varietal: args.varietal,
      "price-min": args["price-min"],
      "price-max": args["price-max"],
      drinkability: args.drinkability,
      body: args.body,
      farming: args.farming,
      dietary: args.dietary,
      collection: args.collection,
      "in-stock": args["in-stock"],
      filter: args.filter,
    };

    const result = await withSpinner("Searching products…", () =>
      nodeRuntime.services.searchProducts({
        q: args.query,
        warehouseCode: configResult.data.store.code,
        filterFlags,
        limit: validateLimit(args.limit),
        page: validatePage(args.page),
        packageName: args.package,
        sort: validateSort(args.sort),
      }),
    );
    if (!result.success) throw result.error;

    showSummary(result.data.summary);

    const formatOptions: FormatOptions = {
      json: args.json,
      columns: result.data.includesPackageColumn ? SEARCH_COLUMNS : SEARCH_COLUMNS_NO_PACKAGE,
    };

    console.log(formatOutput(result.data.rows, formatOptions));
  },
});
