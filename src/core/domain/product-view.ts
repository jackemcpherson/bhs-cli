import {
  extractBody,
  extractDietary,
  extractDrinkability,
  extractFarming,
  extractVarietal,
} from "../../lib/attributes";
import { extractRegion } from "../../lib/region";
import type { Product } from "../../types";

export interface ProductSearchRow extends Record<string, unknown> {
  masterSku: string;
  name: string;
  displayPrice: string;
  displayPackage?: string;
  stock: number;
  productType: string;
  displayRegion: string;
}

export function findVariantByPackage(hit: Product, packageName: string) {
  const lower = packageName.toLowerCase();
  return hit.variants.find((variant) => variant.packageName.toLowerCase().includes(lower));
}

export function toProductSearchRow(hit: Product, warehouseCode: string): ProductSearchRow {
  const warehouse = hit.warehouses.find((entry) => entry.code === warehouseCode);

  return {
    ...hit,
    displayPrice: `$${hit.price.toFixed(2)}`,
    displayPackage: hit.variants[0]?.packageName ?? "-",
    stock: warehouse?.availableQty ?? 0,
    displayRegion: extractRegion(hit.productAttributes),
  };
}

export function toPackageSearchRow(
  hit: Product,
  packageName: string,
  warehouseCode: string,
): ProductSearchRow | undefined {
  const variant = findVariantByPackage(hit, packageName);
  if (!variant) return undefined;

  const warehouse = hit.warehouses.find((entry) => entry.code === warehouseCode);

  return {
    ...hit,
    displayPackage: variant.packageName,
    displayPrice: `$${variant.price.toFixed(2)}`,
    displayRegion: extractRegion(hit.productAttributes),
    stock: warehouse?.availableQty ?? 0,
  };
}

export function toProductDetailEntries(
  product: Product,
  store: { code: string; name: string },
): readonly (readonly [string, string])[] {
  const warehouse = product.warehouses.find((entry) => entry.code === store.code);
  const stockDisplay = warehouse ? `${warehouse.availableQty} @ ${store.name}` : `0 @ ${store.name}`;
  const collections = product.customCollections?.join(", ") ?? "-";
  const attrs = product.productAttributes;

  const variantLines =
    product.variants.length > 1
      ? product.variants
          .map((variant) => {
            return `${variant.packageName}: $${variant.price.toFixed(2)} (${variant.quantityAvailable} avail)`;
          })
          .join("  |  ")
      : `$${product.price.toFixed(2)}`;

  return [
    ["Name", product.name],
    ["SKU", product.masterSku],
    ["Price", `$${product.price.toFixed(2)}`],
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
}
