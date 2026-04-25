import { describe, expect, it, vi } from "vitest";
import { ConfigError, PromptCancelledError } from "../../src/core/domain/errors";
import { resolveStore } from "../../src/core/services/resolve-store";
import { ok } from "../../src/lib/result";
import type { BhsConfig, Store } from "../../src/types";

const stores: Store[] = [
  {
    id: "1",
    slug: "fitzroy",
    name: "Fitzroy",
    postCode: "3065",
    warehouseCode: "311",
    address: "Smith St",
    phone: "123",
    allowCNC: true,
  },
];

function makeConfigStore(config?: BhsConfig) {
  let current = config;
  return {
    readConfig: vi.fn(async () => current),
    writeConfig: vi.fn(async (next: BhsConfig) => {
      current = next;
    }),
  };
}

describe("resolveStore", () => {
  it("prefers store override over persisted config", async () => {
    const configStore = makeConfigStore({ store: { code: "999", name: "Old" } });
    const result = await resolveStore(
      {
        configStore,
        fetchStores: async () => ok(stores),
        findStoreByName: (query, values) => values.find((store) => store.name === query),
        canPrompt: true,
      },
      "Fitzroy",
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.store.code).toBe("311");
  });

  it("returns ConfigError for non-interactive first run without a configured store", async () => {
    const result = await resolveStore(
      {
        configStore: makeConfigStore(),
        fetchStores: async () => ok(stores),
        findStoreByName: () => undefined,
        canPrompt: false,
      },
      undefined,
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeInstanceOf(ConfigError);
  });

  it("persists interactive first-run selection", async () => {
    const configStore = makeConfigStore();
    const result = await resolveStore(
      {
        configStore,
        fetchStores: async () => ok(stores),
        findStoreByName: () => undefined,
        canPrompt: true,
        ui: {
          withSpinner: async (_message, fn) => fn(),
          showSummary: () => {},
          selectStore: async () => stores[0],
        },
      },
      undefined,
    );

    expect(result.success).toBe(true);
    expect(configStore.writeConfig).toHaveBeenCalledTimes(1);
  });

  it("returns PromptCancelledError when selection is cancelled", async () => {
    const result = await resolveStore(
      {
        configStore: makeConfigStore(),
        fetchStores: async () => ok(stores),
        findStoreByName: () => undefined,
        canPrompt: true,
        ui: {
          withSpinner: async (_message, fn) => fn(),
          showSummary: () => {},
          selectStore: async () => undefined,
        },
      },
      undefined,
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeInstanceOf(PromptCancelledError);
  });
});
