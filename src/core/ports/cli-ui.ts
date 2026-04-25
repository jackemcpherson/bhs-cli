import type { Store } from "../../types";

export interface CliUi {
  withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T>;
  showSummary(message: string): void;
  selectStore(stores: readonly Store[]): Promise<Store | undefined>;
}
