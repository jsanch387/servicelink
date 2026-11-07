/** Customer tip in cents. Missing means no tip. Never a Stripe fee. */
export function parseTipCents(
  raw: unknown
): { ok: true; tipCents: number } | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, tipCents: 0 };
  }
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0) {
    return {
      ok: false,
      error: 'tipCents must be a whole number of cents, or omitted.',
    };
  }
  return { ok: true, tipCents: raw };
}
