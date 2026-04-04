export interface TableColumnConfig {
  readonly key: string;
  readonly label?: string;
  readonly maxWidth?: number;
}

interface TableOptions {
  readonly columns: readonly TableColumnConfig[];
}

function toDisplayValue(value: unknown): string {
  if (value == null) return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return `${str.slice(0, max - 1)}\u2026`;
}

function padRight(str: string, width: number): string {
  if (str.length >= width) return str;
  return str + " ".repeat(width - str.length);
}

export function formatTable(
  data: readonly Record<string, unknown>[],
  options: TableOptions,
): string {
  if (data.length === 0) return "No results.";

  const columns = options.columns;
  const termWidth = process.stdout.columns ?? 120;

  const colWidths: number[] = columns.map((col) => (col.label ?? col.key).length);

  for (const row of data) {
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (!col) continue;
      const len = toDisplayValue(row[col.key]).length;
      const max = col.maxWidth ?? 30;
      const current = colWidths[i] ?? 0;
      colWidths[i] = Math.min(max, Math.max(current, len));
    }
  }

  const gap = 2;
  const visibleIndices: number[] = [];
  let usedWidth = 0;

  for (let i = 0; i < columns.length; i++) {
    const w = colWidths[i] ?? 0;
    const needed = usedWidth > 0 ? w + gap : w;
    if (usedWidth + needed > termWidth && visibleIndices.length > 0) break;
    visibleIndices.push(i);
    usedWidth += needed;
  }

  const separator = "  ";

  const headerParts = visibleIndices.map((i) => {
    const col = columns[i];
    const width = colWidths[i] ?? 0;
    return padRight(col?.label ?? col?.key ?? "", width);
  });
  const header = headerParts.join(separator);

  const dividerParts = visibleIndices.map((i) => "\u2500".repeat(colWidths[i] ?? 0));
  const divider = dividerParts.join(separator);

  const rows = data.map((row) => {
    const parts = visibleIndices.map((i) => {
      const col = columns[i];
      const width = colWidths[i] ?? 0;
      if (!col) return "";
      const val = truncate(toDisplayValue(row[col.key]), width);
      return padRight(val, width);
    });
    return parts.join(separator);
  });

  return [header, divider, ...rows].join("\n");
}
