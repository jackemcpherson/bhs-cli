import { defineCommand } from "citty";
import pc from "picocolors";
import { OUTPUT_FLAGS } from "../flags";
import { formatJson } from "../formatters/json";
import { nodeRuntime } from "../node-runtime";
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
  run: async ({ args }) => {
    if (args.store) {
      const storesResult = await withSpinner("Fetching stores…", () =>
        nodeRuntime.clients.graphql.fetchStores(),
      );
      if (!storesResult.success) throw storesResult.error;

      const store = nodeRuntime.helpers.findStoreByName(args.store, storesResult.data);
      if (!store) {
        throw new Error(
          `Store "${args.store}" not found. Run \`bhs stores\` to see available stores.`,
        );
      }

      const config = { store: { code: store.warehouseCode, name: store.name } };
      await nodeRuntime.stores.config.writeConfig(config);
      console.log(
        `${pc.green("✓")} Default store set to ${pc.bold(store.name)} (${store.warehouseCode})`,
      );
      return;
    }

    const config = await nodeRuntime.stores.config.readConfig();
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
  },
});
