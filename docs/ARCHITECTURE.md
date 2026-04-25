# bhs-cli Architecture Target

## Goal

Make `bhs-cli` a small, reusable reference for a modern TypeScript CLI while keeping the core compatible with Cloudflare Workers and MCP execution.

This project has two valid runtime environments:

- `Node CLI`: local terminal usage, config persistence, browser opening, interactive prompts
- `Worker/MCP`: no filesystem, no `child_process`, no direct terminal control, `fetch`-first execution

The architecture should reflect that split explicitly.

## Design Principles

1. Core code must be runtime-agnostic.
2. Platform-specific behavior must live at the edge.
3. Remote API responses must be validated at the boundary.
4. Commands should be thin adapters over use-case functions.
5. Output shaping should be separate from data fetching.
6. Only the executable entrypoint should own process exit behavior.

## Target Structure

```text
src/
  cli/
    commands/
    formatters/
    prompts/
    node-runtime.ts
    error-boundary.ts
  core/
    ports/
      config-store.ts
      checkout-store.ts
      logger.ts
      ui.ts
      url-opener.ts
    services/
      search-products.ts
      get-product.ts
      list-stores.ts
      list-facets.ts
      cart-service.ts
      resolve-store.ts
    domain/
      filters.ts
      product-view.ts
      cart-view.ts
      errors.ts
    schemas/
      graphql.ts
      meilisearch.ts
      config.ts
  infra/
    bhs/
      graphql-client.ts
      meilisearch-client.ts
    node/
      file-config-store.ts
      file-checkout-store.ts
      clack-ui.ts
      browser-url-opener.ts
  lib/
    result.ts
  types.ts
  index.ts
  cli.ts
```

## Layer Responsibilities

### `core/domain`

Owns business rules and project-specific concepts:

- search filter construction
- package filtering behavior
- view-model shaping rules
- domain error types

Must not import Node APIs, `process`, `fs`, or `child_process`.

### `core/ports`

Defines interfaces for anything environment-dependent:

- config persistence
- checkout persistence
- interactive selection
- summary/error output
- opening checkout URLs

Example:

```ts
export interface ConfigStore {
  readConfig(): Promise<BhsConfig | undefined>;
  writeConfig(config: BhsConfig): Promise<void>;
}
```

### `core/services`

Implements use-cases by composing ports and infrastructure clients:

- `searchProducts`
- `getProduct`
- `resolveStore`
- `addCartItem`
- `listCart`

These services should return typed `Result`s or throw domain errors consistently, but they should not print, exit, prompt, or touch the filesystem directly.

### `infra/bhs`

Contains Worker-safe HTTP clients:

- only depends on `fetch`
- accepts injected options
- validates remote payloads with Zod
- maps transport failures into typed errors

Example:

```ts
export interface MeilisearchClientOptions {
  fetchFn?: typeof fetch;
  baseUrl: string;
  index: string;
  apiKey?: string;
}
```

### `infra/node`

Contains Node-only adapters:

- config files under XDG/AppData
- checkout UID persistence
- Clack prompts and spinners
- opening URLs with `open`/`xdg-open`

Nothing in this folder should be imported by Worker-safe library code.

### `cli`

Thin command adapters only:

- parse flags
- call a service
- select a formatter
- print the result

Commands should not know HTTP details, config file paths, or backend payload shapes.

## Current To Target Mapping

### Keep with minor refinement

- `src/cli/formatters/*`
- `src/lib/result.ts`
- `src/cli/validation.ts`
- `src/cli/flags.ts`
- `src/cli/package-search.ts` as domain/service logic

### Move into Worker-safe infrastructure

- `src/api/graphql.ts` -> `src/infra/bhs/graphql-client.ts`
- `src/api/meilisearch.ts` -> `src/infra/bhs/meilisearch-client.ts`

Changes required:

- inject `fetch`
- inject base URLs and API keys
- add Zod response schemas
- remove direct hard-coded environment constants from module scope where practical

### Move into core services/domain

- `src/cli/store-resolution.ts` -> `src/core/services/resolve-store.ts`
- row-shaping logic in `search.ts`, `product.ts`, `cart.ts` -> `core/domain/*-view.ts`
- filter construction in `src/api/meilisearch.ts` -> `src/core/domain/filters.ts`

### Move into Node adapters

- `src/config.ts` -> split across:
  - `src/core/ports/config-store.ts`
  - `src/core/ports/checkout-store.ts`
  - `src/infra/node/file-config-store.ts`
  - `src/infra/node/file-checkout-store.ts`
- `openUrl()` from `src/cli/commands/cart.ts` -> `src/infra/node/browser-url-opener.ts`
- spinner and prompt behavior -> `src/infra/node/clack-ui.ts`

## Recommended Public Surface

The package should expose a Worker-safe library API by default.

`src/index.ts` should export:

- core types
- service factories
- Worker-safe HTTP client factories
- pure helpers such as filter builders and formatters where useful

It should not require Node APIs at import time.

Example direction:

```ts
export { createGraphqlClient } from "./infra/bhs/graphql-client";
export { createMeilisearchClient } from "./infra/bhs/meilisearch-client";
export { searchProducts } from "./core/services/search-products";
export { getProduct } from "./core/services/get-product";
```

## Runtime Validation Standard

Every remote boundary should validate responses before returning typed data.

Apply Zod to:

- Meilisearch search results
- single product lookup
- facet results
- stores query response
- checkout mutation/query responses

Rule:

- `unknown` comes in from `response.json()`
- schema validates it
- only validated data crosses into service/domain code

This is the most important robustness upgrade for a public-API-based project.

## Error Model

Use a small, explicit taxonomy:

- `TransportError`
- `ValidationError`
- `ConfigError`
- `StoreResolutionError`
- `CheckoutError`

Error formatting belongs in the CLI adapter, not in core services.

Only `src/cli.ts` should translate failures into exit codes.

## Worker Compatibility Rules

Worker-safe code must not import:

- `node:*`
- `process`
- `child_process`
- `@clack/prompts`

Allowed in Worker-safe code:

- `fetch`
- `URL`
- `zod`
- pure TypeScript utilities

Rule of thumb:

- `core/` and `infra/bhs/` must be Worker-safe
- `infra/node/` and `cli/` may be Node-specific

## Migration Sequence

### Phase 1: Stabilize boundaries

1. Introduce Zod schemas for GraphQL and Meilisearch responses.
2. Convert `src/api/*.ts` into injected, Worker-safe client modules.
3. Move filter building into a pure domain module.

### Phase 2: Separate core from Node runtime

1. Split `config.ts` into ports plus Node implementations.
2. Move browser-opening into a `UrlOpener` port.
3. Move prompt/spinner behavior behind a UI port.

### Phase 3: Thin the command layer

1. Extract search/product/cart/store use-cases into `core/services`.
2. Move row/detail shaping into presenter/domain helpers.
3. Make commands only parse args, call services, and print formatted output.

### Phase 4: Improve test coverage

Add tests for:

- validated client behavior with mocked `fetch`
- service-level behavior with fake ports
- command stdout/stderr behavior
- Worker-safe imports for the library entrypoint

## What "Good" Looks Like For This Repo

`bhs-cli` does not need the breadth of `fitzRoy-ts`.

It should instead aim for:

- very small core
- strict runtime boundaries
- excellent compatibility across Node and Workers
- simple, obvious file layout
- transport validation everywhere
- minimal command logic

That is the right reference standard for this project.
