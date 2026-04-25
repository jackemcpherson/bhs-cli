import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { ConfigError } from "../../core/domain/errors";
import { BhsConfigSchema } from "../../core/schemas/config";
import type { ConfigStore } from "../../core/ports/config-store";
import type { BhsConfig, Store } from "../../types";

export function getConfigDir(): string {
  if (process.platform === "win32") {
    const baseDir = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(baseDir, "bhs");
  }

  const baseDir = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(baseDir, "bhs");
}

export function createFileConfigStore(configDir = getConfigDir()): ConfigStore {
  const configPath = join(configDir, "config.json");

  return {
    async readConfig() {
      try {
        const raw = await readFile(configPath, "utf-8");
        return BhsConfigSchema.parse(JSON.parse(raw));
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
          return undefined;
        }
        const detail = error instanceof Error ? error.message : String(error);
        throw new ConfigError(`Invalid config at ${configPath}: ${detail}`);
      }
    },

    async writeConfig(config: BhsConfig) {
      await mkdir(dirname(configPath), { recursive: true });
      await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
    },
  };
}

export function findStoreByName(query: string, stores: readonly Store[]): Store | undefined {
  const lower = query.toLowerCase();
  const exact = stores.find((store) => store.name.toLowerCase() === lower);
  if (exact) return exact;
  return stores.find((store) => store.name.toLowerCase().includes(lower));
}
