import type { OutputFormat } from "../../types";
import { formatJson } from "./json";
import { formatTable, type TableColumnConfig } from "./table";

export { formatDetail } from "./detail";
export { formatJson } from "./json";
export type { TableColumnConfig } from "./table";

export interface FormatOptions {
  readonly json: boolean | undefined;
  readonly columns: readonly TableColumnConfig[] | undefined;
}

export function resolveFormat(options: FormatOptions): OutputFormat {
  if (options.json) return "json";
  if (!process.stdout.isTTY) return "json";
  return "table";
}

export function formatOutput(
  data: readonly Record<string, unknown>[],
  options: FormatOptions,
): string {
  const format = resolveFormat(options);
  switch (format) {
    case "json":
      return formatJson(data);
    case "table":
      return formatTable(data, { columns: options.columns ?? [] });
  }
}
