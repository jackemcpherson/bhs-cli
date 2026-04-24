import { exec } from "node:child_process";
import { platform } from "node:os";
import { defineCommand } from "citty";
import pc from "picocolors";
import {
  addLineItems,
  createCheckout,
  deleteCheckout,
  getCheckout,
  updateLineItemQuantity,
} from "../../api/graphql";
import { getProductBySku } from "../../api/meilisearch";
import { clearCheckoutUid, readCheckoutUid, readConfig, writeCheckoutUid } from "../../config";
import type { Checkout } from "../../types";
import { withErrorBoundary } from "../error-boundary";
import { OUTPUT_FLAGS } from "../flags";
import { type FormatOptions, formatOutput } from "../formatters/index";
import { showSummary, withSpinner } from "../ui";

const SHARECART_BASE = "https://blackheartsandsparrows.com.au/sharecart";

const CART_COLUMNS = [
  { key: "sku", label: "SKU", maxWidth: 8 },
  { key: "title", label: "Name", maxWidth: 35 },
  { key: "qty", label: "Qty", maxWidth: 4 },
  { key: "unitPrice", label: "Price", maxWidth: 8 },
  { key: "discount", label: "Discount", maxWidth: 12 },
  { key: "lineTotal", label: "Total", maxWidth: 10 },
];

async function ensureCheckout(): Promise<string> {
  const existing = readCheckoutUid();
  if (existing) return existing;
  const result = await createCheckout();
  if (!result.success) throw result.error;
  writeCheckoutUid(result.data.uid);
  return result.data.uid;
}

function formatCart(checkout: Checkout): Record<string, unknown>[] {
  return checkout.lineItems.map((item) => {
    const discount = item.discounts[0];
    return {
      sku: item.masterSku,
      title: item.title,
      qty: item.quantity,
      unitPrice: `$${item.singlePrice.toFixed(2)}`,
      discount: discount ? `-$${(discount.discountAmount * item.quantity).toFixed(2)}` : "-",
      lineTotal: `$${(item.discountedPrice * item.quantity).toFixed(2)}`,
    };
  });
}

function printCartSummary(checkout: Checkout): void {
  const isTTY = process.stdout.isTTY === true;
  if (!isTTY) return;

  const totalItems = checkout.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasDiscount = checkout.subtotal !== checkout.discountedSubtotal;

  console.error("");
  if (hasDiscount) {
    console.error(pc.dim(`  Subtotal:  $${checkout.subtotal.toFixed(2)}`));
    console.error(
      pc.green(`  Discount:  -$${(checkout.subtotal - checkout.discountedSubtotal).toFixed(2)}`),
    );
  }
  console.error(pc.dim(`  GST:       $${checkout.gst.toFixed(2)}`));
  console.error(pc.bold(`  Total:     $${checkout.total.toFixed(2)}`));
  console.error(pc.dim(`  ${totalItems} item${totalItems === 1 ? "" : "s"}`));
}

function openUrl(url: string): void {
  const cmd = platform() === "darwin" ? "open" : "xdg-open";
  exec(`${cmd} ${JSON.stringify(url)}`);
}

const addCommand = defineCommand({
  meta: { name: "add", description: "Add a product to cart" },
  args: {
    sku: { type: "positional", description: "Product SKU", required: true },
    qty: { type: "string", description: "Quantity (default 1)" },
  },
  run: withErrorBoundary(async ({ args }) => {
    const quantity = args.qty ? Number.parseInt(args.qty, 10) : 1;
    if (Number.isNaN(quantity) || quantity < 1) {
      throw new Error("Quantity must be a positive integer");
    }

    const config = readConfig();
    const warehouseCode = config?.store.code ?? "311";

    const [product, uid] = await withSpinner("Adding to cart\u2026", () =>
      Promise.all([getProductBySku(args.sku, warehouseCode), ensureCheckout()]),
    );
    if (!product.success) throw product.error;

    const result = await addLineItems(uid, [{ sku: args.sku, masterSku: args.sku, quantity }]);
    if (!result.success) throw result.error;

    showSummary(`Added ${quantity}x ${product.data.name} to cart`);
    printCartSummary(result.data);
  }),
});

const removeCommand = defineCommand({
  meta: { name: "remove", description: "Remove a product from cart" },
  args: {
    sku: { type: "positional", description: "Product SKU", required: true },
  },
  run: withErrorBoundary(async ({ args }) => {
    const uid = readCheckoutUid();
    if (!uid) {
      throw new Error("Cart is empty");
    }

    const result = await withSpinner("Removing from cart\u2026", () =>
      updateLineItemQuantity(uid, [{ sku: args.sku, masterSku: args.sku, quantity: 0 }]),
    );
    if (!result.success) throw result.error;

    showSummary(`Removed ${args.sku} from cart`);
    printCartSummary(result.data);
  }),
});

const listCommand = defineCommand({
  meta: { name: "list", description: "Show cart contents" },
  args: { ...OUTPUT_FLAGS },
  run: withErrorBoundary(async ({ args }) => {
    const uid = readCheckoutUid();
    if (!uid) {
      showSummary("Cart is empty");
      return;
    }

    const result = await withSpinner("Loading cart\u2026", () => getCheckout(uid));
    if (!result.success) throw result.error;

    const checkout = result.data;
    if (checkout.lineItems.length === 0) {
      showSummary("Cart is empty");
      return;
    }

    showSummary(
      `${checkout.lineItems.length} product${checkout.lineItems.length === 1 ? "" : "s"} in cart`,
    );

    const rows = formatCart(checkout);
    const formatOptions: FormatOptions = {
      json: args.json,
      columns: CART_COLUMNS,
    };
    console.log(formatOutput(rows, formatOptions));
    if (!args.json) {
      printCartSummary(checkout);
    }
  }),
});

const clearCommand = defineCommand({
  meta: { name: "clear", description: "Clear the cart" },
  args: {},
  run: withErrorBoundary(async () => {
    const uid = readCheckoutUid();
    if (!uid) {
      showSummary("Cart is already empty");
      return;
    }

    await withSpinner("Clearing cart\u2026", () => deleteCheckout(uid));
    clearCheckoutUid();
    showSummary("Cart cleared");
  }),
});

const checkoutCommand = defineCommand({
  meta: { name: "checkout", description: "Open cart in browser for checkout" },
  args: {},
  run: withErrorBoundary(async () => {
    const uid = readCheckoutUid();
    if (!uid) {
      throw new Error("Cart is empty. Add items first with `bhs cart add <SKU>`");
    }

    const result = await withSpinner("Loading cart\u2026", () => getCheckout(uid));
    if (!result.success) throw result.error;

    if (result.data.lineItems.length === 0) {
      throw new Error("Cart is empty. Add items first with `bhs cart add <SKU>`");
    }

    const url = `${SHARECART_BASE}/${uid}`;
    showSummary(`Opening ${url}`);
    openUrl(url);
  }),
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
