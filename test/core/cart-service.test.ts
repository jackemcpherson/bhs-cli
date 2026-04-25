import { describe, expect, it, vi } from "vitest";
import { GraphQLError } from "../../src/core/domain/errors";
import { createCartService } from "../../src/core/services/cart-service";
import { ok } from "../../src/lib/result";
import type { Checkout } from "../../src/types";

function makeCheckout(): Checkout {
  return {
    uid: "checkout-1",
    status: "OPEN",
    subtotal: 10,
    discountedSubtotal: 10,
    gst: 0.91,
    total: 10,
    lineItems: [],
  };
}

describe("createCartService", () => {
  it("clears local checkout UID when the remote checkout no longer exists", async () => {
    const checkoutStore = {
      readCheckoutUid: vi.fn(async () => "checkout-1"),
      writeCheckoutUid: vi.fn(async () => {}),
      clearCheckoutUid: vi.fn(async () => {}),
    };

    const service = createCartService({
      checkoutStore,
      graphqlClient: {
        createCheckout: vi.fn(async () => ok(makeCheckout())),
        getCheckout: vi.fn(async () => ({
          success: false as const,
          error: new GraphQLError("Checkout not found"),
        })),
        addLineItems: vi.fn(),
        updateLineItemQuantity: vi.fn(),
        deleteCheckout: vi.fn(),
      },
      catalogClient: {
        getProductBySku: vi.fn(),
      },
    });

    const result = await service.list();
    expect(result.success).toBe(false);
    expect(checkoutStore.clearCheckoutUid).toHaveBeenCalledTimes(1);
  });
});
