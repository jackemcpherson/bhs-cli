import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { isCancel, select } from "@clack/prompts";
import { z } from "zod";
import { ConfigError } from "./lib/errors";
import type { BhsConfig, Store } from "./types";

const CONFIG_DIR = join(homedir(), ".config", "bhs");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

const BhsConfigSchema = z.object({
  store: z.object({
    code: z.string(),
    name: z.string(),
  }),
});

export function readConfig(): BhsConfig | undefined {
  if (!existsSync(CONFIG_PATH)) {
    return undefined;
  }
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    return BhsConfigSchema.parse(parsed);
  } catch (error) {
    throw new ConfigError(
      `Invalid config at ${CONFIG_PATH}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function writeConfig(config: BhsConfig): void {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
}

export function findStoreByName(query: string, stores: readonly Store[]): Store | undefined {
  const lower = query.toLowerCase();
  const exact = stores.find((s) => s.name.toLowerCase() === lower);
  if (exact) return exact;
  return stores.find((s) => s.name.toLowerCase().includes(lower));
}

export async function firstRunPicker(stores: readonly Store[]): Promise<BhsConfig> {
  const choice = await select({
    message: "Select your default store:",
    options: stores.map((s) => ({
      value: s.warehouseCode,
      label: `${s.name} (${s.postCode ?? "N/A"})`,
      hint: s.address ?? "",
    })),
  });

  if (isCancel(choice)) {
    process.exit(0);
  }

  const store = stores.find((s) => s.warehouseCode === choice);
  if (!store) {
    throw new ConfigError("Failed to resolve selected store");
  }

  const config: BhsConfig = { store: { code: store.warehouseCode, name: store.name } };
  writeConfig(config);
  return config;
}
