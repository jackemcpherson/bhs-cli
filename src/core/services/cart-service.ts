import { ok, type Result } from "../../lib/result";
import type { Checkout, Product } from "../../types";
import { type CartRow, toCartRows } from "../domain/cart-view";
import { CheckoutError, GraphQLError } from "../domain/errors";
import type { CheckoutStore } from "../ports/checkout-store";
import type { UrlOpener } from "../ports/url-opener";

interface CartGraphqlClient {
  createCheckout(): Promise<Result<Checkout, Error>>;
  getCheckout(uid: string): Promise<Result<Checkout, Error>>;
  addLineItems(
    uid: string,
    items: readonly { sku: string; masterSku: string; quantity: number }[],
  ): Promise<Result<Checkout, Error>>;
  updateLineItemQuantity(
    uid: string,
    items: readonly { sku: string; masterSku: string; quantity: number }[],
  ): Promise<Result<Checkout, Error>>;
  deleteCheckout(uid: string): Promise<Result<void, Error>>;
}

interface CartCatalogClient {
  getProductBySku(sku: string): Promise<Result<Product, Error>>;
}

export interface CartServiceDependencies {
  readonly checkoutStore: CheckoutStore;
  readonly graphqlClient: CartGraphqlClient;
  readonly catalogClient: CartCatalogClient;
  readonly urlOpener?: UrlOpener;
  readonly sharecartBaseUrl?: string;
}

export interface CartMutationResult {
  readonly checkout: Checkout;
  readonly summary: string;
}

export interface CartListResult {
  readonly checkout: Checkout | undefined;
  readonly rows: readonly CartRow[];
  readonly summary: string;
  readonly isEmpty: boolean;
}

function isMissingCheckoutError(error: Error): boolean {
  return error instanceof GraphQLError && error.message === "Checkout not found";
}

export function createCartService(deps: CartServiceDependencies) {
  const sharecartBaseUrl =
    deps.sharecartBaseUrl ?? "https://blackheartsandsparrows.com.au/sharecart";

  async function ensureCheckout(): Promise<Result<string, Error>> {
    const existing = await deps.checkoutStore.readCheckoutUid();
    if (existing) return ok(existing);

    const result = await deps.graphqlClient.createCheckout();
    if (!result.success) return result;

    await deps.checkoutStore.writeCheckoutUid(result.data.uid);
    return ok(result.data.uid);
  }

  async function loadCheckout(uid: string): Promise<Result<Checkout, Error>> {
    const result = await deps.graphqlClient.getCheckout(uid);
    if (!result.success) {
      if (isMissingCheckoutError(result.error)) {
        await deps.checkoutStore.clearCheckoutUid();
        return {
          success: false,
          error: new CheckoutError(
            "Saved cart was not found on the server. The local cart reference was cleared.",
          ),
        };
      }
      return result;
    }

    return result;
  }

  return {
    async add(sku: string, quantity: number): Promise<Result<CartMutationResult, Error>> {
      const [productResult, uidResult] = await Promise.all([
        deps.catalogClient.getProductBySku(sku),
        ensureCheckout(),
      ]);

      if (!productResult.success) return productResult;
      if (!uidResult.success) return uidResult;

      const result = await deps.graphqlClient.addLineItems(uidResult.data, [
        { sku, masterSku: sku, quantity },
      ]);
      if (!result.success) return result;

      return ok({
        checkout: result.data,
        summary: `Added ${quantity}x ${productResult.data.name} to cart`,
      });
    },

    async remove(sku: string): Promise<Result<CartMutationResult, Error>> {
      const uid = await deps.checkoutStore.readCheckoutUid();
      if (!uid) {
        return { success: false, error: new CheckoutError("Cart is empty") };
      }

      const result = await deps.graphqlClient.updateLineItemQuantity(uid, [
        { sku, masterSku: sku, quantity: 0 },
      ]);
      if (!result.success) return result;

      return ok({
        checkout: result.data,
        summary: `Removed ${sku} from cart`,
      });
    },

    async list(): Promise<Result<CartListResult, Error>> {
      const uid = await deps.checkoutStore.readCheckoutUid();
      if (!uid) {
        return ok({
          checkout: undefined,
          rows: [],
          summary: "Cart is empty",
          isEmpty: true,
        });
      }

      const checkout = await loadCheckout(uid);
      if (!checkout.success) return checkout;

      if (checkout.data.lineItems.length === 0) {
        return ok({
          checkout: checkout.data,
          rows: [],
          summary: "Cart is empty",
          isEmpty: true,
        });
      }

      return ok({
        checkout: checkout.data,
        rows: toCartRows(checkout.data),
        summary: `${checkout.data.lineItems.length} product${checkout.data.lineItems.length === 1 ? "" : "s"} in cart`,
        isEmpty: false,
      });
    },

    async clear(): Promise<Result<{ summary: string }, Error>> {
      const uid = await deps.checkoutStore.readCheckoutUid();
      if (!uid) {
        return ok({ summary: "Cart is already empty" });
      }

      const result = await deps.graphqlClient.deleteCheckout(uid);
      if (!result.success && !isMissingCheckoutError(result.error)) {
        return result;
      }

      await deps.checkoutStore.clearCheckoutUid();
      return ok({ summary: "Cart cleared" });
    },

    async checkout(): Promise<Result<{ url: string; summary: string }, Error>> {
      const uid = await deps.checkoutStore.readCheckoutUid();
      if (!uid) {
        return {
          success: false,
          error: new CheckoutError("Cart is empty. Add items first with `bhs cart add <SKU>`"),
        };
      }

      const checkout = await loadCheckout(uid);
      if (!checkout.success) return checkout;
      if (checkout.data.lineItems.length === 0) {
        return {
          success: false,
          error: new CheckoutError("Cart is empty. Add items first with `bhs cart add <SKU>`"),
        };
      }

      const url = `${sharecartBaseUrl}/${uid}`;
      if (deps.urlOpener) {
        await deps.urlOpener.openUrl(url);
      }

      return ok({
        url,
        summary: `Opening ${url}`,
      });
    },
  };
}
