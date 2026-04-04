import pc from "picocolors";
import { ConfigError, GraphQLError, MeilisearchError } from "../lib/errors";

export function formatError(error: unknown): string {
  if (error instanceof MeilisearchError) {
    const status = error.statusCode ? ` (HTTP ${error.statusCode})` : "";
    return `${pc.red("Search error:")} ${error.message}${status}`;
  }
  if (error instanceof GraphQLError) {
    const status = error.statusCode ? ` (HTTP ${error.statusCode})` : "";
    return `${pc.red("API error:")} ${error.message}${status}`;
  }
  if (error instanceof ConfigError) {
    return `${pc.red("Config error:")} ${error.message}`;
  }
  if (error instanceof Error) {
    return `${pc.red("Error:")} ${error.message}`;
  }
  return `${pc.red("Error:")} ${String(error)}`;
}

export function withErrorBoundary<T extends { args: Record<string, unknown> }>(
  fn: (ctx: T) => Promise<void>,
): (ctx: T) => Promise<void> {
  return async (ctx) => {
    try {
      await fn(ctx);
    } catch (error: unknown) {
      console.error(formatError(error));
      process.exit(1);
    }
  };
}
