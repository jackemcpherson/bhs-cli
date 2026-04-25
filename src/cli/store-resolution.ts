import { nodeRuntime } from "./node-runtime";

export async function resolveStore(storeOverride: string | undefined) {
  const result = await nodeRuntime.services.resolveStore(storeOverride);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}
