import { describe, expect, it } from "vitest";
import { ValidationError } from "../../src/core/domain/errors";
import { createGraphqlClient } from "../../src/infra/bhs/graphql-client";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("createGraphqlClient", () => {
  it("validates store payloads and honors injected fetch", async () => {
    const requests: string[] = [];
    const client = createGraphqlClient({
      url: "https://example.test/graphql",
      fetchFn: async (input) => {
        requests.push(String(input));
        return jsonResponse({
          data: {
            stores: [
              {
                id: "1",
                slug: "fitzroy",
                name: "Fitzroy",
                postCode: "3065",
                warehouseCode: "311",
                address: "Smith St",
                phone: "123",
                allowCNC: true,
              },
            ],
          },
        });
      },
    });

    const result = await client.fetchStores();
    expect(result.success).toBe(true);
    expect(requests).toEqual(["https://example.test/graphql"]);
  });

  it("returns ValidationError on malformed payloads", async () => {
    const client = createGraphqlClient({
      fetchFn: async () => jsonResponse({ data: { stores: [{ id: 1 }] } }),
    });

    const result = await client.fetchStores();
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeInstanceOf(ValidationError);
  });

  it("maps transport failures to GraphQLError", async () => {
    const client = createGraphqlClient({
      fetchFn: async () => new Response("boom", { status: 502, statusText: "Bad Gateway" }),
    });

    const result = await client.fetchStores();
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.name).toBe("GraphQLError");
  });
});
