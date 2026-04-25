import type { Checkout, LineItemInput, Store } from "../types";
import { createGraphqlClient } from "../infra/bhs/graphql-client";
import type { Result } from "../lib/result";

const client = createGraphqlClient();

export async function fetchStores(): Promise<Result<Store[], Error>> {
  return client.fetchStores();
}

export async function createCheckout(): Promise<Result<Checkout, Error>> {
  return client.createCheckout();
}

export async function getCheckout(uid: string): Promise<Result<Checkout, Error>> {
  return client.getCheckout(uid);
}

export async function addLineItems(
  checkoutUid: string,
  lineItems: readonly LineItemInput[],
): Promise<Result<Checkout, Error>> {
  return client.addLineItems(checkoutUid, lineItems);
}

export async function updateLineItemQuantity(
  checkoutUid: string,
  lineItems: readonly LineItemInput[],
): Promise<Result<Checkout, Error>> {
  return client.updateLineItemQuantity(checkoutUid, lineItems);
}

export async function deleteCheckout(uid: string): Promise<Result<void, Error>> {
  return client.deleteCheckout(uid);
}
