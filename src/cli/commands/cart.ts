import { defineCommand } from "citty";
import pc from "picocolors";
import { getCartTotalsSummary } from "../../core/domain/cart-view";
import type { Checkout } from "../../types";
import { OUTPUT_FLAGS } from "../flags";
import { type FormatOptions, formatOutput } from "../formatters/index";
import { nodeRuntime } from "../node-runtime";
import { showSummary, withSpinner } from "../ui";

const CART_COLUMNS = [
  { key: "sku", label: "SKU", maxWidth: 8 },
  { key: "title", label: "Name", maxWidth: 35 },
  { key: "qty", label: "Qty", maxWidth: 4 },
  { key: "unitPrice", label: "Price", maxWidth: 8 },
  { key: "discount", label: "Discount", maxWidth: 12 },
  { key: "lineTotal", label: "Total", maxWidth: 10 },
] as const;

function formatCartTotals(checkout: Checkout): readonly string[] {
  const summary = getCartTotalsSummary(checkout);
  const lines: string[] = [""];

  if (summary.discount) {
    lines.push(pc.dim(`  Subtotal:  ${summary.subtotal}`));
    lines.push(pc.green(`  Discount:  ${summary.discount}`));
  }

  lines.push(pc.dim(`  GST:       ${summary.gst}`));
  lines.push(pc.bold(`  Total:     ${summary.total}`));
  lines.push(pc.dim(`  ${summary.totalItems} item${summary.totalItems === 1 ? "" : "s"}`));

  return lines;
}

function printCartSummary(checkout: Checkout): void {
  if (process.stdout.isTTY !== true) return;
  for (const line of formatCartTotals(checkout)) {
    console.error(line);
  }
}

const addCommand = defineCommand({
  meta: { name: "add", description: "Add a product to cart" },
  args: {
    sku: { type: "positional", description: "Product SKU", required: true },
    qty: { type: "string", description: "Quantity (default 1)" },
  },
  run: async ({ args }) => {
    const quantity = args.qty ? Number.parseInt(args.qty, 10) : 1;
    if (Number.isNaN(quantity) || quantity < 1) {
      throw new Error("Quantity must be a positive integer");
    }

    const result = await withSpinner("Adding to cart…", () =>
      nodeRuntime.services.cart.add(args.sku, quantity),
    );
    if (!result.success) throw result.error;

    showSummary(result.data.summary);
    printCartSummary(result.data.checkout);
  },
});

const removeCommand = defineCommand({
  meta: { name: "remove", description: "Remove a product from cart" },
  args: {
    sku: { type: "positional", description: "Product SKU", required: true },
  },
  run: async ({ args }) => {
    const result = await withSpinner("Removing from cart…", () =>
      nodeRuntime.services.cart.remove(args.sku),
    );
    if (!result.success) throw result.error;

    showSummary(result.data.summary);
    printCartSummary(result.data.checkout);
  },
});

const listCommand = defineCommand({
  meta: { name: "list", description: "Show cart contents" },
  args: { ...OUTPUT_FLAGS },
  run: async ({ args }) => {
    const result = await withSpinner("Loading cart…", () => nodeRuntime.services.cart.list());
    if (!result.success) throw result.error;

    showSummary(result.data.summary);
    if (result.data.isEmpty) return;

    const formatOptions: FormatOptions = {
      json: args.json,
      columns: CART_COLUMNS,
    };
    console.log(formatOutput(result.data.rows, formatOptions));

    if (!args.json && result.data.checkout) {
      printCartSummary(result.data.checkout);
    }
  },
});

const clearCommand = defineCommand({
  meta: { name: "clear", description: "Clear the cart" },
  args: {},
  run: async () => {
    const result = await withSpinner("Clearing cart…", () => nodeRuntime.services.cart.clear());
    if (!result.success) throw result.error;
    showSummary(result.data.summary);
  },
});

const checkoutCommand = defineCommand({
  meta: { name: "checkout", description: "Open cart in browser for checkout" },
  args: {},
  run: async () => {
    const result = await withSpinner("Loading cart…", () => nodeRuntime.services.cart.checkout());
    if (!result.success) throw result.error;
    showSummary(result.data.summary);
  },
});

export const cartCommand = defineCommand({
  meta: {
    name: "cart",
    description: "Manage your cart",
  },
  subCommands: {
    add: () => Promise.resolve(addCommand),
    remove: () => Promise.resolve(removeCommand),
    list: () => Promise.resolve(listCommand),
    clear: () => Promise.resolve(clearCommand),
    checkout: () => Promise.resolve(checkoutCommand),
  },
});
