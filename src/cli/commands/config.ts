import { defineCommand } from "citty";
import pc from "picocolors";
import { fetchStores } from "../../api/graphql";
import { findStoreByName, readConfig, writeConfig } from "../../config";
import { withErrorBoundary } from "../error-boundary";
import { OUTPUT_FLAGS } from "../flags";
import { formatJson } from "../formatters/json";
import { withSpinner } from "../ui";

export const configCommand = defineCommand({
  meta: {
    name: "config",
    description: "Show or update configuration",
  },
  args: {
    store: {
      type: "string",
      description: "Set default store by name",
    },
    ...OUTPUT_FLAGS,
  },
  run: withErrorBoundary(async ({ args }) => {
    if (args.store) {
      const storesResult = await withSpinner("Fetching stores\u2026", () => fetchStores());
      if (!storesResult.success) throw storesResult.error;

      const store = findStoreByName(args.store, storesResult.data);
      if (!store) {
        throw new Error(
          `Store "${args.store}" not found. Run \`bhs stores\` to see available stores.`,
        );
      }

      const config = { store: { code: store.warehouseCode, name: store.name } };
      writeConfig(config);
      console.log(
        `${pc.green("\u2713")} Default store set to ${pc.bold(store.name)} (${store.warehouseCode})`,
      );
      return;
    }

    const config = readConfig();
    if (!config) {
      console.log("No configuration found.");
      console.log(`Run ${pc.bold("bhs config --store <name>")} or any command to set up.`);
      return;
    }

    if (args.json) {
      console.log(formatJson(config));
    } else {
      console.log(`Store: ${pc.bold(config.store.name)} (${config.store.code})`);
    }
  }),
});
