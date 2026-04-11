/**
 * Normalizes `DELETE /api/quotes/[id]` (and similar) JSON for the client modal.
 */

export type ParseDeleteQuoteResult =
  | { ok: true }
  | { ok: false; error: string };

export function parseDeleteQuoteApiResponse(
  httpOk: boolean,
  status: number,
  body: unknown
): ParseDeleteQuoteResult {
  if (
    httpOk &&
    body !== null &&
    typeof body === 'object' &&
    (body as { success?: boolean }).success === true
  ) {
    return { ok: true };
  }

  const err = (body as { error?: unknown } | null)?.error;
  if (typeof err === 'string' && err.trim()) {
    return { ok: false, error: err };
  }

  if (status === 404) {
    return { ok: false, error: 'Quote not found.' };
  }
  if (status === 401 || status === 403) {
    return {
      ok: false,
      error: 'You do not have permission to delete this quote.',
    };
  }

  return {
    ok: false,
    error: 'Failed to delete quote. Please try again.',
  };
}
