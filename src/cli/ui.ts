import { spinner } from "@clack/prompts";
import pc from "picocolors";

const isTTY = process.stdout.isTTY === true;

export async function withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T> {
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
}

export function showSummary(message: string): void {
  if (!isTTY) return;
  console.error(pc.dim(message));
}
