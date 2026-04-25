import type { Checkout } from "../../types";

export interface CartRow extends Record<string, unknown> {
  sku: string;
  title: string;
  qty: number;
  unitPrice: string;
  discount: string;
  lineTotal: string;
}

export interface CartTotalsSummary {
  readonly totalItems: number;
  readonly subtotal: string;
  readonly discount: string | undefined;
  readonly gst: string;
  readonly total: string;
}

export function toCartRows(checkout: Checkout): readonly CartRow[] {
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

export function getCartTotalsSummary(checkout: Checkout): CartTotalsSummary {
  const totalItems = checkout.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = checkout.subtotal - checkout.discountedSubtotal;

  return {
    totalItems,
    subtotal: `$${checkout.subtotal.toFixed(2)}`,
    discount: discountAmount > 0 ? `-$${discountAmount.toFixed(2)}` : undefined,
    gst: `$${checkout.gst.toFixed(2)}`,
    total: `$${checkout.total.toFixed(2)}`,
  };
}

