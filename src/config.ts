import { createFileCheckoutStore } from "./infra/node/file-checkout-store";
import { createFileConfigStore, findStoreByName, getConfigDir } from "./infra/node/file-config-store";
import { createClackUi } from "./infra/node/clack-ui";
import { ConfigError, PromptCancelledError } from "./core/domain/errors";
import type { BhsConfig, Store } from "./types";

const configStore = createFileConfigStore();
const checkoutStore = createFileCheckoutStore();
const ui = createClackUi();

export { findStoreByName, getConfigDir };

export async function readConfig(): Promise<BhsConfig | undefined> {
  return configStore.readConfig();
}

export async function writeConfig(config: BhsConfig): Promise<void> {
  return configStore.writeConfig(config);
}

export async function readCheckoutUid(): Promise<string | undefined> {
  return checkoutStore.readCheckoutUid();
}

export async function writeCheckoutUid(uid: string): Promise<void> {
  return checkoutStore.writeCheckoutUid(uid);
}

export async function clearCheckoutUid(): Promise<void> {
  return checkoutStore.clearCheckoutUid();
}

export async function firstRunPicker(stores: readonly Store[]): Promise<BhsConfig> {
  if (process.stdin.isTTY !== true || process.stdout.isTTY !== true) {
    throw new ConfigError(
      "No store is configured. Run `bhs config --store <name>` or pass `--store <name>`.",
    );
  }

  const store = await ui.selectStore(stores);
  if (!store) {
    throw new PromptCancelledError("Store selection cancelled");
  }

  const config: BhsConfig = { store: { code: store.warehouseCode, name: store.name } };
  await configStore.writeConfig(config);
  return config;
}
