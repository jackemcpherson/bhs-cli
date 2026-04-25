import { CheckoutDeleteResponseSchema, CheckoutGetResponseSchema, CheckoutMutationResponseSchema, CheckoutSchema, CheckoutCreateResponseSchema, StoresResponseSchema } from "../../core/schemas/graphql";
import { GraphQLError } from "../../core/domain/errors";
import { err, ok, type Result } from "../../lib/result";
import type { Checkout, LineItemInput, Store } from "../../types";
import { DEFAULT_GRAPHQL_URL } from "./defaults";
import { resolveFetch, validateResult } from "./http";

export interface GraphqlClientOptions {
  fetchFn?: typeof fetch;
  url: string;
}

export interface GraphqlClient {
  fetchStores(): Promise<Result<Store[], Error>>;
  createCheckout(): Promise<Result<Checkout, Error>>;
  getCheckout(uid: string): Promise<Result<Checkout, Error>>;
  addLineItems(uid: string, items: readonly LineItemInput[]): Promise<Result<Checkout, Error>>;
  updateLineItemQuantity(
    uid: string,
    items: readonly LineItemInput[],
  ): Promise<Result<Checkout, Error>>;
  deleteCheckout(uid: string): Promise<Result<void, Error>>;
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

async function parseJsonResponse(response: Response): Promise<Result<unknown, Error>> {
  try {
    return ok(await response.json());
  } catch (error) {
    return err(new GraphQLError("GraphQL response was not valid JSON", { cause: error }));
  }
}

function unwrapGraphqlErrors(
  json: { errors?: readonly { message: string }[] },
): Result<void, Error> | undefined {
  const firstError = json.errors?.[0];
  if (!firstError) return undefined;
  return err(new GraphQLError(firstError.message));
}

function defaultGraphqlClientOptions(options?: Partial<GraphqlClientOptions>): GraphqlClientOptions {
  return {
    url: options?.url ?? DEFAULT_GRAPHQL_URL,
    ...(options?.fetchFn ? { fetchFn: options.fetchFn } : {}),
  };
}

export function createGraphqlClient(options?: Partial<GraphqlClientOptions>): GraphqlClient {
  const resolved = defaultGraphqlClientOptions(options);
  const fetchFn = resolveFetch(resolved.fetchFn);

  async function postGraphQL(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<Result<unknown, Error>> {
    try {
      const response = await fetchFn(resolved.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        return err(
          new GraphQLError(`GraphQL request failed: ${response.statusText}`, {
            statusCode: response.status,
          }),
        );
      }

      return parseJsonResponse(response);
    } catch (error) {
      return err(new GraphQLError(String(error instanceof Error ? error.message : error), { cause: error }));
    }
  }

  async function validate<T>(
    result: Result<unknown, Error>,
    parser: (input: unknown) => T,
    label: string,
  ): Promise<Result<T, Error>> {
    const validated = await validateResult(result, parser, `GraphQL ${label}`);
    if (!validated.success) return validated;

    const errorResult = unwrapGraphqlErrors(validated.data as { errors?: readonly { message: string }[] });
    if (errorResult) return errorResult as Result<T, Error>;
    return validated;
  }

  async function mutateLineItems(
    mutationName: string,
    checkoutUid: string,
    items: readonly LineItemInput[],
  ): Promise<Result<Checkout, Error>> {
    const result = await postGraphQL(
      `mutation($lineItems: [LineItemInput]!, $checkoutUid: ID!) {
        ${mutationName}(lineItems: $lineItems, checkoutUid: $checkoutUid) {
          checkout { ${CHECKOUT_FIELDS} }
        }
      }`,
      { lineItems: items, checkoutUid },
    );
    const validated = await validate(
      result,
      (input) => CheckoutMutationResponseSchema.parse(input),
      `${mutationName} mutation`,
    );
    if (!validated.success) return validated;

    const mutation = validated.data.data[mutationName];
    if (!mutation) {
      return err(new GraphQLError(`Unexpected response: missing ${mutationName}`));
    }

    return ok(CheckoutSchema.parse(mutation.checkout));
  }

  return {
    async fetchStores() {
      const result = await postGraphQL(STORES_QUERY);
      const validated = await validate(result, (input) => StoresResponseSchema.parse(input), "stores");
      if (!validated.success) return validated;
      return ok([...validated.data.data.stores]);
    },

    async createCheckout() {
      const result = await postGraphQL(
        `mutation { createCheckout { checkout { ${CHECKOUT_FIELDS} } } }`,
      );
      const validated = await validate(
        result,
        (input) => CheckoutCreateResponseSchema.parse(input),
        "createCheckout",
      );
      if (!validated.success) return validated;
      return ok(validated.data.data.createCheckout.checkout);
    },

    async getCheckout(uid: string) {
      const result = await postGraphQL(
        `query($uid: ID!) { getCheckout(uid: $uid) { ${CHECKOUT_FIELDS} } }`,
        { uid },
      );
      const validated = await validate(
        result,
        (input) => CheckoutGetResponseSchema.parse(input),
        "getCheckout",
      );
      if (!validated.success) return validated;
      const checkout = validated.data.data.getCheckout;
      if (!checkout) {
        return err(new GraphQLError("Checkout not found"));
      }
      return ok(checkout);
    },

    async addLineItems(uid: string, items: readonly LineItemInput[]) {
      return mutateLineItems("addLineItemsToCheckout", uid, items);
    },

    async updateLineItemQuantity(uid: string, items: readonly LineItemInput[]) {
      return mutateLineItems("updateLineItemsQuantity", uid, items);
    },

    async deleteCheckout(uid: string) {
      const result = await postGraphQL(
        `mutation($input: deleteCheckoutInput!) { deleteCheckout(input: $input) { checkout { uid } } }`,
        { input: { where: { id: uid } } },
      );
      const validated = await validate(
        result,
        (input) => CheckoutDeleteResponseSchema.parse(input),
        "deleteCheckout",
      );
      if (!validated.success) return validated;
      return ok(undefined);
    },
  };
}
