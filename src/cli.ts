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
  },
});

runMain(main).catch((error: unknown) => {
  console.error(formatError(error));
  process.exit(1);
});
