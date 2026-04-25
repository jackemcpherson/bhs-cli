import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CheckoutUidSchema } from "../../core/schemas/config";
import type { CheckoutStore } from "../../core/ports/checkout-store";
import { getConfigDir } from "./file-config-store";

export function createFileCheckoutStore(configDir = getConfigDir()): CheckoutStore {
  const checkoutPath = join(configDir, "checkout.json");

  return {
    async readCheckoutUid() {
      try {
        const raw = await readFile(checkoutPath, "utf-8");
        const parsed = CheckoutUidSchema.parse(JSON.parse(raw));
        return parsed.uid;
      } catch {
        return undefined;
      }
    },

    async writeCheckoutUid(uid: string) {
      await mkdir(configDir, { recursive: true });
      await writeFile(checkoutPath, `${JSON.stringify({ uid }, null, 2)}\n`, "utf-8");
    },

    async clearCheckoutUid() {
      await rm(checkoutPath, { force: true });
    },
  };
}
