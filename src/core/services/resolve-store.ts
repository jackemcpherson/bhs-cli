import { ConfigError, PromptCancelledError, StoreResolutionError } from "../domain/errors";
import type { CliUi } from "../ports/cli-ui";
import type { ConfigStore } from "../ports/config-store";
import { ok, type Result } from "../../lib/result";
import type { BhsConfig, Store } from "../../types";

export interface ResolveStoreDependencies {
  readonly configStore: ConfigStore;
  readonly ui?: CliUi;
  readonly fetchStores: () => Promise<Result<Store[], Error>>;
  readonly findStoreByName: (query: string, stores: readonly Store[]) => Store | undefined;
  readonly canPrompt: boolean;
  readonly persistSelection?: boolean;
}

export async function resolveStore(
  deps: ResolveStoreDependencies,
  storeOverride: string | undefined,
): Promise<Result<BhsConfig, Error>> {
  if (storeOverride) {
    const storesResult = await deps.fetchStores();
    if (!storesResult.success) return storesResult;

    const store = deps.findStoreByName(storeOverride, storesResult.data);
    if (!store) {
      return {
        success: false,
        error: new StoreResolutionError(
          `Store "${storeOverride}" not found. Run \`bhs stores\` to see stores.`,
        ),
      };
    }

    return ok({ store: { code: store.warehouseCode, name: store.name } });
  }

  const config = await deps.configStore.readConfig();
  if (config) return ok(config);

  const storesResult = await deps.fetchStores();
  if (!storesResult.success) return storesResult;

  if (!deps.canPrompt || !deps.ui) {
    return {
      success: false,
      error: new ConfigError(
        "No store is configured. Run `bhs config --store <name>` or pass `--store <name>`.",
      ),
    };
  }

  const store = await deps.ui.selectStore(storesResult.data);
  if (!store) {
    return { success: false, error: new PromptCancelledError("Store selection cancelled") };
  }

  const nextConfig = { store: { code: store.warehouseCode, name: store.name } };
  if (deps.persistSelection !== false) {
    await deps.configStore.writeConfig(nextConfig);
  }
  return ok(nextConfig);
}
