import { toValidationError } from "../../core/domain/errors";
import { err, ok, type Result } from "../../lib/result";

export function resolveFetch(fetchFn?: typeof fetch): typeof fetch {
  const resolved = fetchFn ?? globalThis.fetch;
  if (!resolved) {
    throw new Error("No fetch implementation available");
  }
  return resolved;
}

export async function validateResult<T>(
  result: Result<unknown, Error>,
  parser: (input: unknown) => T,
  label: string,
): Promise<Result<T, Error>> {
  if (!result.success) return result;

  try {
    return ok(parser(result.data));
  } catch (error) {
    return err(toValidationError(`Invalid ${label} payload`, error));
  }
}
