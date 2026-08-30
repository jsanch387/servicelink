/** Fetch / AbortController cancellation — including Next's "without reason" shape. */
export function isAbortError(error: unknown): boolean {
  if (error == null || typeof error !== 'object') return false;

  const name = 'name' in error ? String(error.name) : '';
  const message = 'message' in error ? String(error.message) : '';

  return name === 'AbortError' || /aborted/i.test(message);
}
