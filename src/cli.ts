#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { resolveAliases } from "./cli/alias-resolution";
import { formatError } from "./cli/error-boundary";

resolveAliases();

declare const PACKAGE_VERSION: string;

const main = defineCommand({
  meta: {
    name: "bhs",
    version: PACKAGE_VERSION,
    description: "Search Blackhearts & Sparrows products and check stock",
  },
  subCommands: {
    search: () => import("./cli/commands/search").then((m) => m.searchCommand),
    product: () => import("./cli/commands/product").then((m) => m.productCommand),
    stores: () => import("./cli/commands/stores").then((m) => m.storesCommand),
    facets: () => import("./cli/commands/facets").then((m) => m.facetsCommand),
    config: () => import("./cli/commands/config").then((m) => m.configCommand),
    cart: () => import("./cli/commands/cart").then((m) => m.cartCommand),
  },
});

runMain(main).catch((error: unknown) => {
  const formatted = formatError(error);
  if (formatted) {
    console.error(formatted);
    process.exit(1);
    return;
  }

  process.exit(0);
});
