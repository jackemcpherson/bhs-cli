import { build } from "esbuild";
import { afterAll, describe, expect, it } from "vitest";

const builds: { stop?: () => void }[] = [];

afterAll(() => {
  for (const item of builds) {
    item.stop?.();
  }
});

describe("library entrypoint", () => {
  it("bundles without node-only imports", async () => {
    const result = await build({
      entryPoints: ["src/index.ts"],
      bundle: true,
      write: false,
      format: "esm",
      platform: "neutral",
      packages: "external",
    });

    const output = result.outputFiles[0]?.text ?? "";
    expect(output).not.toContain("node:");
    expect(output).not.toContain("child_process");
    expect(output).not.toContain("node:fs");
    builds.push(result);
  });
});
