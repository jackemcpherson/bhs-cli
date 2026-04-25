import type { FacetResult } from "../../types";
import type { Result } from "../../lib/result";

interface FacetReader {
  getFacets(
    facetNames: readonly string[],
    warehouseCode: string,
  ): Promise<Result<FacetResult, Error>>;
}

export interface ListFacetsDependencies {
  readonly client: FacetReader;
}

export async function listFacets(
  deps: ListFacetsDependencies,
  facetNames: readonly string[],
  warehouseCode: string,
): Promise<Result<FacetResult, Error>> {
  const result = await deps.client.getFacets(facetNames, warehouseCode);
  return result;
}
