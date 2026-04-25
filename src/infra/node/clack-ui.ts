import { isCancel, select, spinner } from "@clack/prompts";
import pc from "picocolors";
import { PromptCancelledError } from "../../core/domain/errors";
import type { CliUi } from "../../core/ports/cli-ui";
import type { Store } from "../../types";

export function createClackUi(): CliUi {
  const isTTY = process.stdout.isTTY === true;

  return {
    async withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T> {
      if (!isTTY) {
        return fn();
      }

      const s = spinner();
      s.start(message);
      try {
        const result = await fn();
        s.stop(message);
        return result;
      } catch (error) {
        s.stop("Failed");
        throw error;
      }
    },

    showSummary(message: string): void {
      if (!isTTY) return;
      console.error(pc.dim(message));
    },

    async selectStore(stores: readonly Store[]): Promise<Store | undefined> {
      if (process.stdin.isTTY !== true || process.stdout.isTTY !== true) {
        return undefined;
      }

      const choice = await select({
        message: "Select your default store:",
        options: stores.map((store) => ({
          value: store.warehouseCode,
          label: `${store.name} (${store.postCode ?? "N/A"})`,
          hint: store.address ?? "",
        })),
      });

      if (isCancel(choice)) {
        throw new PromptCancelledError("Store selection cancelled");
      }

      return stores.find((store) => store.warehouseCode === choice);
    },
  };
}
