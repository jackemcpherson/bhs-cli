const SHORT_TO_LONG: Readonly<Record<string, string>> = {
  "-c": "--country",
  "-j": "--json",
  "-l": "--limit",
  "-p": "--package",
  "-s": "--store",
  "--min-price": "--price-min",
  "--max-price": "--price-max",
};

export function resolveAliases(): void {
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg == null) continue;
    const eqIdx = arg.indexOf("=");
    const key = eqIdx === -1 ? arg : arg.slice(0, eqIdx);
    const long = SHORT_TO_LONG[key];
    if (long) {
      process.argv[i] = eqIdx === -1 ? long : `${long}${arg.slice(eqIdx)}`;
    }
  }
}
