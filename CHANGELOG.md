# Changelog

## 2.0.0 (2026-04-24)

### Breaking Changes

- **Filter behavior changed**: `--body`, `--drinkability`, `--dietary`, `--farming`, `--region`, and `--varietal` now use correct Meilisearch fields instead of the imprecise `productAttributes.name` fallback. Results will be more accurate but may differ from v1.x.

### Added

- `--country` flag (`-c`) for precise country filtering via `region_lvl0` (e.g., `bhs search --country France`)
- `bhs cart` subcommand with server-side cart management:
  - `bhs cart add <SKU> [--qty N]` — add products to cart
  - `bhs cart remove <SKU>` — remove products
  - `bhs cart list` — show cart with server-calculated discounts
  - `bhs cart clear` — clear the cart
  - `bhs cart checkout` — open cart in browser for payment
- Cart API functions exported from library: `createCheckout`, `getCheckout`, `addLineItems`, `updateLineItemQuantity`, `deleteCheckout`
- Cart types exported: `Checkout`, `LineItem`, `LineItemDiscount`, `LineItemInput`

### Fixed

- `--body Medium` no longer returns false positives from ACID attribute collision (now uses `body.name`)
- `--drinkability` no longer overcounts (now uses `drinkability.name`)
- `--dietary` no longer overcounts (now uses `dietary.name`)
- `--farming Organic` now returns results (was querying `productAttributes.name` where farming values don't exist; now uses top-level `farming` field)
- `--varietal` simplified to use `productAttributes.name` only (removed dead `varietal_lvl0`/`varietal_lvl1` clauses)
- `--region` simplified to use `productAttributes.name` only (removed broken `region_lvl1`/`region_lvl2` clauses that required hierarchical prefixes users wouldn't type)

## 1.1.0 (2026-04-04)

### Added

- Extract region, body, drinkability, varietal from `productAttributes`
- `--package` flag for filtering by package type

## 1.0.0 (2026-04-04)

Initial release. CLI for searching Blackhearts & Sparrows products and checking stock.
