import type { ProductAttribute } from "../types";

const BODY_CODES: ReadonlyMap<string, string> = new Map([
  ["LITE", "Light"],
  ["L-M", "Light - Medium"],
  ["MED", "Medium"],
  ["M-F", "Medium - Full"],
  ["FULL", "Full"],
]);

const DRINKABILITY_CODES: ReadonlyMap<string, string> = new Map([
  ["GUZ", "Guzzle"],
  ["IMP", "Impress"],
  ["CONT", "Contemplate"],
]);

const DIETARY_CODES: ReadonlyMap<string, string> = new Map([
  ["VG", "Vegan"],
  ["ORG", "Organic"],
  ["BIOD", "Biodynamic"],
  ["SF", "Sulphur Free"],
  ["LOWSUL", "Low Sulphur"],
]);

const FARMING_CODES: ReadonlyMap<string, string> = new Map([
  ["ORG", "Organic"],
  ["BIOD", "Biodynamic"],
]);

export function extractBody(attributes: readonly ProductAttribute[]): string | undefined {
  for (const attr of attributes) {
    const val = BODY_CODES.get(attr.code);
    if (val) return val;
  }
  return undefined;
}

export function extractDrinkability(attributes: readonly ProductAttribute[]): string | undefined {
  for (const attr of attributes) {
    const val = DRINKABILITY_CODES.get(attr.code);
    if (val) return val;
  }
  return undefined;
}

export function extractDietary(attributes: readonly ProductAttribute[]): string[] {
  const results: string[] = [];
  for (const attr of attributes) {
    const val = DIETARY_CODES.get(attr.code);
    if (val && !results.includes(val)) results.push(val);
  }
  return results;
}

export function extractFarming(attributes: readonly ProductAttribute[]): string[] {
  const results: string[] = [];
  for (const attr of attributes) {
    const val = FARMING_CODES.get(attr.code);
    if (val && !results.includes(val)) results.push(val);
  }
  return results;
}

export function extractVarietal(attributes: readonly ProductAttribute[]): string | undefined {
  for (const attr of attributes) {
    if (/^[RWSB]\d/.test(attr.code)) return attr.name;
  }
  return undefined;
}
