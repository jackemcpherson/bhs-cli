import type { BhsConfig } from "../../types";

export interface ConfigStore {
  readConfig(): Promise<BhsConfig | undefined>;
  writeConfig(config: BhsConfig): Promise<void>;
}
