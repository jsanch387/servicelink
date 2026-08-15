/**
 * Validate first-visit date/time from public membership checkout body / Stripe metadata.
 */

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function parseMembershipFirstVisitDate(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!YMD_RE.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return value;
}

export function parseMembershipFirstVisitTime(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().slice(0, 5);
  const match = value.match(HHMM_RE);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
