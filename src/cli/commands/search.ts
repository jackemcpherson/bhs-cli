import { defineCommand } from "citty";
import { fetchStores } from "../../api/graphql";
import { buildFilter, searchProducts } from "../../api/meilisearch";
import { findStoreByName, firstRunPicker, readConfig } from "../../config";
import { extractRegion } from "../../lib/region";
import type { BhsConfig, Product, SearchFilterFlags } from "../../types";
import { withErrorBoundary } from "../error-boundary";
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
import { showSummary, withSpinner } from "../ui";
import { validateLimit, validatePage, validateSort } from "../validation";

const SEARCH_COLUMNS = [
  { key: "name", label: "Name", maxWidth: 40 },
  { key: "displayPrice", label: "Price", maxWidth: 10 },
  { key: "displayPackage", label: "Package", maxWidth: 14 },
  { key: "stock", label: "Stock", maxWidth: 6 },
  { key: "productType", label: "Type", maxWidth: 15 },
  { key: "displayRegion", label: "Region", maxWidth: 20 },
];

const SEARCH_COLUMNS_NO_PACKAGE = [
  { key: "name", label: "Name", maxWidth: 40 },
  { key: "displayPrice", label: "Price", maxWidth: 8 },
  { key: "stock", label: "Stock", maxWidth: 6 },
  { key: "productType", label: "Type", maxWidth: 15 },
  { key: "displayRegion", label: "Region", maxWidth: 20 },
];

async function resolveStore(storeOverride: string | undefined): Promise<BhsConfig> {
  if (storeOverride) {
    const storesResult = await fetchStores();
    if (!storesResult.success) throw storesResult.error;
    const store = findStoreByName(storeOverride, storesResult.data);
    if (!store) {
      throw new Error(
        `Store "${storeOverride}" not found. Run \`bhs stores\` to see available stores.`,
      );
    }
    return { store: { code: store.warehouseCode, name: store.name } };
  }

  const config = readConfig();
  if (config) return config;

  const storesResult = await fetchStores();
  if (!storesResult.success) throw storesResult.error;
  return firstRunPicker(storesResult.data);
}

function findVariant(hit: Product, packageName: string) {
  const lower = packageName.toLowerCase();
  return hit.variants.find((v) => v.packageName.toLowerCase().includes(lower));
}

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
  run: withErrorBoundary(async ({ args }) => {
    const limit = validateLimit(args.limit);
    const page = validatePage(args.page);
    const sort = validateSort(args.sort);
    const offset = (page - 1) * limit;
    const packageFilter = args.package;

    const config = await resolveStore(args.store);

    const filterFlags: SearchFilterFlags = {
      type: args.type,
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

    const filter = buildFilter(filterFlags, config.store.code);

    const result = await withSpinner("Searching products\u2026", () =>
      searchProducts({
        q: args.query,
        limit: packageFilter ? limit * 3 : limit,
        offset: packageFilter ? 0 : offset,
        filter,
        sort: sort ? [sort] : undefined,
        facets: undefined,
      }),
    );

    if (!result.success) throw result.error;

    const { hits, estimatedTotalHits } = result.data;
    const warehouseCode = config.store.code;

    let rows: Record<string, unknown>[];

    if (packageFilter) {
      const matched = hits
        .map((hit) => {
          const variant = findVariant(hit, packageFilter);
          if (!variant) return undefined;
          const warehouse = hit.warehouses.find((w) => w.code === warehouseCode);
          return {
            ...hit,
            displayPrice: `$${variant.price}`,
            displayPackage: variant.packageName,
            stock: warehouse?.availableQty ?? 0,
            displayRegion: extractRegion(hit.productAttributes),
          };
        })
        .filter((r) => r != null);

      const start = (page - 1) * limit;
      rows = matched.slice(start, start + limit);

      showSummary(`Found ${matched.length} products with "${packageFilter}" (page ${page})`);
    } else {
      const totalPages = Math.ceil(estimatedTotalHits / limit);
      showSummary(`Found ${estimatedTotalHits} products (page ${page} of ${totalPages})`);

      rows = hits.map((hit) => {
        const warehouse = hit.warehouses.find((w) => w.code === warehouseCode);
        return {
          ...hit,
          displayPrice: `$${hit.price}`,
          displayPackage: hit.variants[0]?.packageName ?? "-",
          stock: warehouse?.availableQty ?? 0,
          displayRegion: extractRegion(hit.productAttributes),
        };
      });
    }

    const formatOptions: FormatOptions = {
      json: args.json,
      columns: packageFilter ? SEARCH_COLUMNS : SEARCH_COLUMNS_NO_PACKAGE,
    };

    console.log(formatOutput(rows, formatOptions));
  }),
});
