import pc from "picocolors";
import {
  ConfigError,
  GraphQLError,
  MeilisearchError,
  PromptCancelledError,
  TransportError,
} from "../lib/errors";

export function formatError(error: unknown): string | null {
  if (error instanceof PromptCancelledError) {
    return null;
  }
  if (error instanceof MeilisearchError) {
    const status = error.statusCode ? ` (HTTP ${error.statusCode})` : "";
    return `${pc.red("Search error:")} ${error.message}${status}`;
  }
  if (error instanceof GraphQLError) {
    const status = error.statusCode ? ` (HTTP ${error.statusCode})` : "";
    return `${pc.red("API error:")} ${error.message}${status}`;
  }
  if (error instanceof TransportError) {
    const status = error.statusCode ? ` (HTTP ${error.statusCode})` : "";
    return `${pc.red("Error:")} ${error.message}${status}`;
  }
  if (error instanceof ConfigError) {
    return `${pc.red("Config error:")} ${error.message}`;
  }
  if (error instanceof Error) {
    return `${pc.red("Error:")} ${error.message}`;
  }
  return `${pc.red("Error:")} ${String(error)}`;
}
