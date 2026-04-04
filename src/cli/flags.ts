export const OUTPUT_FLAGS = {
  json: {
    type: "boolean" as const,
    description: "Output as JSON",
    alias: "j",
  },
} as const;

export const STORE_FLAG = {
  store: {
    type: "string" as const,
    description: "Override configured store",
    alias: "s",
  },
} as const;

export const LIMIT_FLAG = {
  limit: {
    type: "string" as const,
    description: "Results per page (default 20)",
    alias: "l",
  },
} as const;

export const PAGE_FLAG = {
  page: {
    type: "string" as const,
    description: "Page number (default 1)",
  },
} as const;

export const SORT_FLAG = {
  sort: {
    type: "string" as const,
    description: "Sort order: price:asc, price:desc",
  },
} as const;

export const SEARCH_FILTER_FLAGS = {
  type: {
    type: "string" as const,
    description: "Product type (Wine, Spirits, Beer, AlcoholFree, Food, Homewares, etc.)",
  },
  region: {
    type: "string" as const,
    description: "Region (country/state/subregion)",
  },
  varietal: {
    type: "string" as const,
    description: "Grape variety",
  },
  "price-min": {
    type: "string" as const,
    description: "Minimum price",
  },
  "price-max": {
    type: "string" as const,
    description: "Maximum price",
  },
  drinkability: {
    type: "string" as const,
    description: "Drinkability (Guzzle, Impress, etc.)",
  },
  body: {
    type: "string" as const,
    description: "Body (Light, Light-Medium, Medium, etc.)",
  },
  farming: {
    type: "string" as const,
    description: "Farming method (Organic, Biodynamic, etc.)",
  },
  dietary: {
    type: "string" as const,
    description: "Dietary tag (Vegan, etc.)",
  },
  collection: {
    type: "string" as const,
    description: "Collection name (Blackhearts Exclusive, etc.)",
  },
  "in-stock": {
    type: "boolean" as const,
    description: "Only show in-stock products",
  },
  filter: {
    type: "string" as const,
    description: "Raw Meilisearch filter expression",
  },
} as const;

export const PACKAGE_FLAG = {
  package: {
    type: "string" as const,
    description: "Package type (Bottle, Can, 4 Pack, 6 Pack, Slab of 24, etc.)",
    alias: "p",
  },
} as const;
