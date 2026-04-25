import { defineCommand } from "citty";
import { OUTPUT_FLAGS, STORE_FLAG } from "../flags";
import { formatDetail } from "../formatters/index";
import { formatJson } from "../formatters/json";
import { nodeRuntime } from "../node-runtime";
import { showSummary, withSpinner } from "../ui";

export const productCommand = defineCommand({
  meta: {
    name: "product",
    description: "View product details by SKU",
  },
  args: {
    sku: {
      type: "positional",
      description: "Product SKU (masterSku)",
      required: true,
    },
    ...OUTPUT_FLAGS,
    ...STORE_FLAG,
  },
  run: async ({ args }) => {
    const configResult = await nodeRuntime.services.resolveStore(args.store);
    if (!configResult.success) throw configResult.error;

    const result = await withSpinner("Fetching product…", () =>
      nodeRuntime.services.getProduct(args.sku, configResult.data.store),
    );
    if (!result.success) throw result.error;

    if (args.json) {
      console.log(formatJson(result.data.product));
      return;
    }

    showSummary(result.data.summary);
    console.log(formatDetail(result.data.entries));
  },
});
