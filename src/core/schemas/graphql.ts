import { z } from "zod";

export const StoreSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  postCode: z.string().nullable(),
  warehouseCode: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  allowCNC: z.boolean().nullable(),
});

const LineItemDiscountSchema = z.object({
  discountName: z.string(),
  discountAmount: z.number(),
  discountedItemPrice: z.number(),
});

const LineItemSchema = z.object({
  id: z.string(),
  masterSku: z.string(),
  sku: z.string(),
  quantity: z.number(),
  title: z.string(),
  packageName: z.string(),
  productType: z.string(),
  singlePrice: z.number(),
  discountedPrice: z.number(),
  discounts: z.array(LineItemDiscountSchema),
});

export const CheckoutSchema = z.object({
  uid: z.string(),
  status: z.string(),
  subtotal: z.number(),
  discountedSubtotal: z.number(),
  gst: z.number(),
  total: z.number(),
  lineItems: z.array(LineItemSchema),
});

const GraphqlErrorSchema = z.object({
  message: z.string(),
});

export const StoresResponseSchema = z.object({
  data: z.object({
    stores: z.array(StoreSchema),
  }),
  errors: z.array(GraphqlErrorSchema).optional(),
});

export const CheckoutCreateResponseSchema = z.object({
  data: z.object({
    createCheckout: z.object({
      checkout: CheckoutSchema,
    }),
  }),
  errors: z.array(GraphqlErrorSchema).optional(),
});

export const CheckoutGetResponseSchema = z.object({
  data: z.object({
    getCheckout: CheckoutSchema.nullable(),
  }),
  errors: z.array(GraphqlErrorSchema).optional(),
});

export const CheckoutMutationResponseSchema = z.object({
  data: z.record(
    z.string(),
    z
      .object({
        checkout: CheckoutSchema,
      })
      .nullish(),
  ),
  errors: z.array(GraphqlErrorSchema).optional(),
});

export const CheckoutDeleteResponseSchema = z.object({
  data: z.object({
    deleteCheckout: z
      .object({
        checkout: z.object({
          uid: z.string(),
        }),
      })
      .nullable(),
  }),
  errors: z.array(GraphqlErrorSchema).optional(),
});
