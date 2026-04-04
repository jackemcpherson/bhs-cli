const SHORT_TO_LONG: Readonly<Record<string, string>> = {
  "-j": "--json",
  "-l": "--limit",
  "-p": "--package",
  "-s": "--store",
};

export function resolveAliases(): void {
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg != null) {
      const long = SHORT_TO_LONG[arg];
      if (long) {
        process.argv[i] = long;
      }
    }
  }
}
