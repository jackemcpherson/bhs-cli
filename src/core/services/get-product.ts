import { ok, type Result } from "../../lib/result";
import type { Product } from "../../types";
import { toProductDetailEntries } from "../domain/product-view";

interface ProductReader {
  getProductBySku(sku: string): Promise<Result<Product, Error>>;
}

export interface GetProductDependencies {
  readonly client: ProductReader;
}

export interface GetProductViewModel {
  readonly product: Product;
  readonly summary: string;
  readonly entries: readonly (readonly [string, string])[];
}

export async function getProductService(
  deps: GetProductDependencies,
  sku: string,
  store: { code: string; name: string },
): Promise<Result<GetProductViewModel, Error>> {
  const result = await deps.client.getProductBySku(sku);
  if (!result.success) return result;

  return ok({
    product: result.data,
    summary: `Product ${result.data.masterSku}`,
    entries: toProductDetailEntries(result.data, store),
  });
}
