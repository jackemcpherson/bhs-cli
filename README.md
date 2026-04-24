# bhs

CLI for searching [Blackhearts & Sparrows](https://blackheartsandsparrows.com.au) products, checking stock, and managing a cart.

## Install

```bash
npm install -g bhs
```

Requires Node.js 20+.

## Commands

### Search

```bash
bhs search pinot noir
bhs search --type Wine --country France --region Burgundy
bhs search --varietal Grenache --price-max 35 --in-stock
bhs search --body Medium --drinkability Guzzle --sort price:asc
bhs search --farming Organic --dietary Vegan --limit 50
```

Flags: `--type`, `--country` (`-c`), `--region`, `--varietal`, `--price-min`, `--price-max`, `--body`, `--drinkability`, `--farming`, `--dietary`, `--collection`, `--in-stock`, `--package` (`-p`), `--sort`, `--filter`, `--limit` (`-l`), `--page`, `--store` (`-s`), `--json` (`-j`)

### Product

```bash
bhs product 44253
bhs product 44253 --json
```

### Stores

```bash
bhs stores
```

### Facets

```bash
bhs facets                    # list all facet names
bhs facets region_lvl0        # show countries with product counts
bhs facets drinkability.name  # show drinkability values
```

### Config

```bash
bhs config                    # show current config
bhs config --store Fitzroy    # set default store
```

### Cart

Server-side cart with automatic discount calculation.

```bash
bhs cart add 44253              # add 1x product
bhs cart add 29920 --qty 6     # add 6x (triggers 10% wine discount)
bhs cart list                   # show cart with discounts
bhs cart remove 29920           # remove product
bhs cart checkout               # open in browser for payment
bhs cart clear                  # empty the cart
```

## Output

Table output by default when connected to a terminal. Pipe or use `--json` for JSON:

```bash
bhs search --type Wine --json | jq '.[].name'
bhs cart list --json
```

## Library

The package also exports typed API functions for programmatic use:

```typescript
import { searchProducts, buildFilter, fetchStores } from "bhs";
import { createCheckout, addLineItems, getCheckout } from "bhs";
```

## License

MIT
