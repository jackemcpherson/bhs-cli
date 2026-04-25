import { ZodError } from "zod";

export class TransportError extends Error {
  override readonly name: string = "TransportError";
  readonly statusCode: number | undefined;
  readonly cause: unknown;

  constructor(message: string, options?: { statusCode?: number; cause?: unknown }) {
    super(message);
    this.statusCode = options?.statusCode;
    this.cause = options?.cause;
  }
}

export class ValidationError extends Error {
  override readonly name = "ValidationError";
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class GraphQLError extends TransportError {
  override readonly name: string = "GraphQLError";
}

export class MeilisearchError extends TransportError {
  override readonly name: string = "MeilisearchError";
}

export class ConfigError extends Error {
  override readonly name = "ConfigError";
}

export class StoreResolutionError extends Error {
  override readonly name = "StoreResolutionError";
}

export class CheckoutError extends Error {
  override readonly name = "CheckoutError";
}

export class PromptCancelledError extends Error {
  override readonly name = "PromptCancelledError";
}

export class BrowserOpenError extends Error {
  override readonly name = "BrowserOpenError";
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export function toValidationError(message: string, error: unknown): ValidationError {
  if (error instanceof ZodError) {
    return new ValidationError(`${message}: ${error.message}`, error);
  }

  return new ValidationError(message, error);
}
