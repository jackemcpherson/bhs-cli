import { defineCommand } from "citty";
import { OUTPUT_FLAGS } from "../flags";
import { type FormatOptions, formatOutput } from "../formatters/index";
import { nodeRuntime } from "../node-runtime";
import { showSummary, withSpinner } from "../ui";

const STORE_COLUMNS = [
  { key: "name", label: "Name", maxWidth: 25 },
  { key: "postCode", label: "Postcode", maxWidth: 10 },
  { key: "warehouseCode", label: "Warehouse", maxWidth: 12 },
  { key: "address", label: "Address", maxWidth: 45 },
  { key: "phone", label: "Phone", maxWidth: 15 },
] as const;

export const storesCommand = defineCommand({
  meta: {
    name: "stores",
    description: "List all stores",
  },
  args: {
    ...OUTPUT_FLAGS,
  },
  run: async ({ args }) => {
    const result = await withSpinner("Fetching stores…", () => nodeRuntime.services.listStores());
    if (!result.success) throw result.error;

    showSummary(`Found ${result.data.length} stores`);

    const formatOptions: FormatOptions = {
      json: args.json,
      columns: STORE_COLUMNS,
    };

    console.log(formatOutput(result.data as unknown as Record<string, unknown>[], formatOptions));
  },
});
