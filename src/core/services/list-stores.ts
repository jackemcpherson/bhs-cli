import { ok, type Result } from "../../lib/result";
import type { Store } from "../../types";

export interface StoresReader {
  fetchStores(): Promise<Result<Store[], Error>>;
}

export async function listStores(deps: StoresReader): Promise<Result<readonly Store[], Error>> {
  const result = await deps.fetchStores();
  if (!result.success) return result;
  return ok(result.data);
}
