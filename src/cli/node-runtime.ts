import { createCartService } from "../core/services/cart-service";
import { getProductService } from "../core/services/get-product";
import { listFacets } from "../core/services/list-facets";
import { listStores } from "../core/services/list-stores";
import { resolveStore } from "../core/services/resolve-store";
import { searchProductsService } from "../core/services/search-products";
import { createGraphqlClient } from "../infra/bhs/graphql-client";
import { createMeilisearchClient } from "../infra/bhs/meilisearch-client";
import { createBrowserUrlOpener } from "../infra/node/browser-url-opener";
import { createClackUi } from "../infra/node/clack-ui";
import { createFileCheckoutStore } from "../infra/node/file-checkout-store";
import { createFileConfigStore, findStoreByName } from "../infra/node/file-config-store";

const graphqlClient = createGraphqlClient();
const meilisearchClient = createMeilisearchClient();
const configStore = createFileConfigStore();
const checkoutStore = createFileCheckoutStore();
const ui = createClackUi();
const urlOpener = createBrowserUrlOpener();

export const nodeRuntime = {
  clients: {
    graphql: graphqlClient,
    meilisearch: meilisearchClient,
  },
  stores: {
    config: configStore,
    checkout: checkoutStore,
  },
  ui,
  urlOpener,
  helpers: {
    findStoreByName,
  },
  services: {
    resolveStore: (storeOverride: string | undefined) =>
      resolveStore(
        {
          configStore,
          ui,
          fetchStores: () => graphqlClient.fetchStores(),
          findStoreByName,
          canPrompt: process.stdin.isTTY === true && process.stdout.isTTY === true,
        },
        storeOverride,
      ),
    listStores: () => listStores({ fetchStores: () => graphqlClient.fetchStores() }),
    listFacets: (facetNames: readonly string[], warehouseCode: string) =>
      listFacets({ client: meilisearchClient }, facetNames, warehouseCode),
    searchProducts: searchProductsService.bind(undefined, { client: meilisearchClient }),
    getProduct: (sku: string, store: { code: string; name: string }) =>
      getProductService({ client: meilisearchClient }, sku, store),
    cart: createCartService({
      checkoutStore,
      graphqlClient,
      catalogClient: meilisearchClient,
      urlOpener,
    }),
  },
};
