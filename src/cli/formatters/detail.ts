export function formatDetail(entries: readonly (readonly [string, string])[]): string {
  const maxKeyLen = Math.max(...entries.map(([key]) => key.length));
  return entries.map(([key, value]) => `${key.padEnd(maxKeyLen)}  ${value}`).join("\n");
}
