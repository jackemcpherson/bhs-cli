import { defineCommand } from "citty";
import { FACET_NAMES } from "../../types";
import { OUTPUT_FLAGS, STORE_FLAG } from "../flags";
import { type FormatOptions, formatOutput } from "../formatters/index";
import { formatJson } from "../formatters/json";
import { nodeRuntime } from "../node-runtime";
import { showSummary, withSpinner } from "../ui";
import { validateFacetName } from "../validation";

const FACET_VALUE_COLUMNS = [
  { key: "value", label: "Value", maxWidth: 40 },
  { key: "count", label: "Count", maxWidth: 8 },
] as const;

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
  run: async ({ args }) => {
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

    const configResult = await nodeRuntime.services.resolveStore(args.store);
    if (!configResult.success) throw configResult.error;

    const facetName = validateFacetName(args.name);
    const result = await withSpinner(`Fetching facet "${facetName}"…`, () =>
      nodeRuntime.services.listFacets([facetName], configResult.data.store.code),
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
  },
});
