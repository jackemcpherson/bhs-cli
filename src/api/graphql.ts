import { GraphQLError } from "../lib/errors";
import { err, ok, type Result } from "../lib/result";
import type { Checkout, LineItemInput, Store } from "../types";

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

async function postGraphQL(
  query: string,
  variables?: Record<string, unknown>,
): Promise<Result<Record<string, unknown>, Error>> {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      return err(
        new GraphQLError(`GraphQL request failed: ${response.statusText}`, response.status),
      );
    }

    const json = (await response.json()) as {
      data?: Record<string, unknown>;
      errors?: readonly { message: string }[];
    };
    const firstError = json.errors?.[0];
    if (firstError) {
      return err(new GraphQLError(firstError.message));
    }
    if (!json.data) {
      return err(new GraphQLError("No data in GraphQL response"));
    }
    return ok(json.data);
  } catch (error) {
    return err(error instanceof Error ? error : new GraphQLError(String(error)));
  }
}

export async function fetchStores(): Promise<Result<Store[], Error>> {
  const result = await postGraphQL(STORES_QUERY);
  if (!result.success) return result;
  const data = result.data as unknown as StoresResponse["data"];
  return ok([...data.stores]);
}

const CHECKOUT_FIELDS = `
  uid
  status
  subtotal
  discountedSubtotal
  gst
  total
  lineItems {
    id
    masterSku
    sku
    quantity
    title
    packageName
    productType
    singlePrice
    discountedPrice
    discounts {
      discountName
      discountAmount
      discountedItemPrice
    }
  }
`;

export async function createCheckout(): Promise<Result<Checkout, Error>> {
  const result = await postGraphQL(
    `mutation { createCheckout { checkout { ${CHECKOUT_FIELDS} } } }`,
  );
  if (!result.success) return result;
  return ok((result.data as { createCheckout: { checkout: Checkout } }).createCheckout.checkout);
}

export async function getCheckout(uid: string): Promise<Result<Checkout, Error>> {
  const result = await postGraphQL(
    `query($uid: ID!) { getCheckout(uid: $uid) { ${CHECKOUT_FIELDS} } }`,
    { uid },
  );
  if (!result.success) return result;
  const checkout = (result.data as { getCheckout: Checkout | null }).getCheckout;
  if (!checkout) {
    return err(new GraphQLError("Checkout not found"));
  }
  return ok(checkout);
}

async function mutateLineItems(
  mutationName: string,
  checkoutUid: string,
  lineItems: readonly LineItemInput[],
): Promise<Result<Checkout, Error>> {
  const result = await postGraphQL(
    `mutation($lineItems: [LineItemInput]!, $checkoutUid: ID!) {
      ${mutationName}(lineItems: $lineItems, checkoutUid: $checkoutUid) {
        checkout { ${CHECKOUT_FIELDS} }
      }
    }`,
    { lineItems, checkoutUid },
  );
  if (!result.success) return result;
  const wrapper = result.data as Record<string, { checkout: Checkout } | undefined>;
  const mutation = wrapper[mutationName];
  if (!mutation) {
    return err(new GraphQLError(`Unexpected response: missing ${mutationName}`));
  }
  return ok(mutation.checkout);
}

export async function addLineItems(
  checkoutUid: string,
  lineItems: readonly LineItemInput[],
): Promise<Result<Checkout, Error>> {
  return mutateLineItems("addLineItemsToCheckout", checkoutUid, lineItems);
}

export async function updateLineItemQuantity(
  checkoutUid: string,
  lineItems: readonly LineItemInput[],
): Promise<Result<Checkout, Error>> {
  return mutateLineItems("updateLineItemsQuantity", checkoutUid, lineItems);
}

export async function deleteCheckout(uid: string): Promise<Result<void, Error>> {
  const result = await postGraphQL(
    `mutation($input: deleteCheckoutInput!) { deleteCheckout(input: $input) { checkout { uid } } }`,
    { input: { where: { id: uid } } },
  );
  if (!result.success) return result;
  return ok(undefined);
}
