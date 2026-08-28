/**
 * Founder-only acquisition report. Not shown in dashboard nav.
 * Add lowercase owner emails that may view ad → paid conversion numbers.
 */
export const INTERNAL_ANALYTICS_EMAILS: readonly string[] = [
  'jesuss387@gmail.com',
];

export function isInternalAnalyticsEmail(
  email: string | null | undefined
): boolean {
  const extra = (process.env.INTERNAL_ANALYTICS_EMAILS ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  const allowed = new Set([
    ...INTERNAL_ANALYTICS_EMAILS.map(value => value.toLowerCase()),
    ...extra,
  ]);
  const normalized = email?.trim().toLowerCase() ?? '';
  if (!normalized) return false;
  return allowed.has(normalized);
}
