/**
 * Parses `quotes.request_message` (same string shape as {@link buildQuoteRequestNote}) on public
 * quote request submit: `Preferred timing: …\n\n<details>` or plain details.
 */
export type ParsedPublicQuoteRequestNote = {
  preferredTiming: string | null;
  /** Customer’s detail text without the timing prefix. */
  detailsOnly: string;
};

export function parsePublicQuoteRequestNote(
  note: string | null | undefined
): ParsedPublicQuoteRequestNote {
  const raw = (note ?? '').trim();
  if (!raw) {
    return { preferredTiming: null, detailsOnly: '' };
  }

  const m = raw.match(/^Preferred timing:\s*([^\r\n]+)(?:\r?\n){2}([\s\S]*)$/);
  if (m) {
    const timing = m[1].trim();
    const detailsOnly = m[2].trim();
    return {
      preferredTiming: timing.length > 0 ? timing : null,
      detailsOnly,
    };
  }

  return { preferredTiming: null, detailsOnly: raw };
}
