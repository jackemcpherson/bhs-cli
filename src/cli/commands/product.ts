import { defineCommand } from "citty";
import { fetchStores } from "../../api/graphql";
import { getProductBySku } from "../../api/meilisearch";
import { findStoreByName, firstRunPicker, readConfig } from "../../config";
import {
  extractBody,
  extractDietary,
  extractDrinkability,
  extractFarming,
  extractVarietal,
} from "../../lib/attributes";
import { extractRegion } from "../../lib/region";
import type { BhsConfig } from "../../types";
import { withErrorBoundary } from "../error-boundary";
import { OUTPUT_FLAGS, STORE_FLAG } from "../flags";
import { formatDetail } from "../formatters/index";
import { formatJson } from "../formatters/json";
import { showSummary, withSpinner } from "../ui";

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
  run: withErrorBoundary(async ({ args }) => {
    const config = await resolveStore(args.store);

    const result = await withSpinner("Fetching product\u2026", () =>
      getProductBySku(args.sku, config.store.code),
    );

    if (!result.success) throw result.error;

    const product = result.data;

    if (args.json) {
      console.log(formatJson(product));
      return;
    }

    const warehouse = product.warehouses.find((w) => w.code === config.store.code);
    const stockDisplay = warehouse
      ? `${warehouse.availableQty} @ ${config.store.name}`
      : `0 @ ${config.store.name}`;

    const collections = product.customCollections?.join(", ") ?? "-";
    const attrs = product.productAttributes;

    showSummary(`Product ${product.masterSku}`);

    const variantLines =
      product.variants.length > 1
        ? product.variants
            .map((v) => `${v.packageName}: $${v.price} (${v.quantityAvailable} avail)`)
            .join("  |  ")
        : `$${product.price}`;

    const entries: (readonly [string, string])[] = [
      ["Name", product.name],
      ["SKU", product.masterSku],
      ["Price", `$${product.price}`],
      ["Variants", variantLines],
      ["Type", product.productType],
      ["Varietal", extractVarietal(attrs) ?? "-"],
      ["Region", extractRegion(attrs)],
      ["Body", extractBody(attrs) ?? "-"],
      ["Drinkability", extractDrinkability(attrs) ?? "-"],
      ["Stock", stockDisplay],
      ["Status", product.stockStatus],
      ["Description", product.description || "-"],
      ["Collection", collections],
      ["Dietary", extractDietary(attrs).join(", ") || "-"],
      ["Farming", extractFarming(attrs).join(", ") || "-"],
    ];

    console.log(formatDetail(entries));
  }),
});
