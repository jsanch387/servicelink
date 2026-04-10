/**
 * Persists optional timeline + required details into `quotes.request_message` for
 * customer-initiated quote requests.
 */
export function buildQuoteRequestNote(
  details: string,
  timelineTrimmed: string | null
): string {
  const body = details.trim();
  const t = timelineTrimmed?.trim() ?? '';
  if (t.length > 0) {
    return `Preferred timing: ${t}\n\n${body}`;
  }
  return body;
}
