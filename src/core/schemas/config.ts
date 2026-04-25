import { z } from "zod";

export const BhsConfigSchema = z.object({
  store: z.object({
    code: z.string(),
    name: z.string(),
  }),
});

export const CheckoutUidSchema = z.object({
  uid: z.string(),
});
