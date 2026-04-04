import { GraphQLError } from "../lib/errors";
import { err, ok, type Result } from "../lib/result";
import type { Store } from "../types";

const GRAPHQL_URL = "https://bhs-cms-mgkle.ondigitalocean.app/graphql";

const STORES_QUERY = `{
  stores(sort: "name") {
    id
    slug
    name
    postCode
    warehouseCode
    address
    phone
    allowCNC
  }
}`;

interface StoresResponse {
  readonly data: {
    readonly stores: readonly Store[];
  };
}

export async function fetchStores(): Promise<Result<Store[], Error>> {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: STORES_QUERY }),
    });

    if (!response.ok) {
      return err(
        new GraphQLError(`Failed to fetch stores: ${response.statusText}`, response.status),
      );
    }

    const json = (await response.json()) as StoresResponse;
    return ok([...json.data.stores]);
  } catch (error) {
    return err(error instanceof Error ? error : new GraphQLError(String(error)));
  }
}
