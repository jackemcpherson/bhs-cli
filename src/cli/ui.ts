import { nodeRuntime } from "./node-runtime";

export async function withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T> {
  return nodeRuntime.ui.withSpinner(message, fn);
}

export function showSummary(message: string): void {
  return nodeRuntime.ui.showSummary(message);
}
