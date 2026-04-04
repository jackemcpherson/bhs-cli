export class MeilisearchError extends Error {
  override readonly name = "MeilisearchError";
  readonly statusCode: number | undefined;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class GraphQLError extends Error {
  override readonly name = "GraphQLError";
  readonly statusCode: number | undefined;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class ConfigError extends Error {
  override readonly name = "ConfigError";
}
