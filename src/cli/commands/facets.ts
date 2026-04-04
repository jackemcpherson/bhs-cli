import { defineCommand } from "citty";
import { fetchStores } from "../../api/graphql";
import { getFacets } from "../../api/meilisearch";
import { findStoreByName, firstRunPicker, readConfig } from "../../config";
import { type BhsConfig, FACET_NAMES } from "../../types";
import { withErrorBoundary } from "../error-boundary";
import { OUTPUT_FLAGS, STORE_FLAG } from "../flags";
import { type FormatOptions, formatOutput } from "../formatters/index";
import { formatJson } from "../formatters/json";
import { showSummary, withSpinner } from "../ui";
import { validateFacetName } from "../validation";

const FACET_VALUE_COLUMNS = [
  { key: "value", label: "Value", maxWidth: 40 },
  { key: "count", label: "Count", maxWidth: 8 },
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

export const facetsCommand = defineCommand({
  meta: {
    name: "facets",
    description: "List available facets or facet values",
  },
  args: {
    name: {
      type: "positional",
      description: "Facet name to get values for",
      required: false,
    },
    ...OUTPUT_FLAGS,
    ...STORE_FLAG,
  },
  run: withErrorBoundary(async ({ args }) => {
    if (!args.name) {
      if (args.json) {
        console.log(formatJson(FACET_NAMES));
      } else {
        console.log("Available facets:\n");
        for (const name of FACET_NAMES) {
          console.log(`  ${name}`);
        }
      }
      return;
    }

    const facetName = validateFacetName(args.name);
    const config = await resolveStore(args.store);

    const result = await withSpinner(`Fetching facet "${facetName}"\u2026`, () =>
      getFacets([facetName], config.store.code),
    );

    if (!result.success) throw result.error;

    const distribution = result.data.facetDistribution[facetName];
    if (!distribution) {
      console.log(`No values found for facet "${facetName}"`);
      return;
    }

    const rows = Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .map(([value, count]) => ({ value, count }));

    showSummary(`Found ${rows.length} values for "${facetName}"`);

    const formatOptions: FormatOptions = {
      json: args.json,
      columns: FACET_VALUE_COLUMNS,
    };

    console.log(formatOutput(rows, formatOptions));
  }),
});
