/**
 * Customer SMS opt-in for membership updates (visit reminders, schedule links).
 *
 * Prefer `customers.sms_opt_in` (source of truth). Checkout still stamps
 * `customer_memberships.metadata.smsOptIn` / Stripe metadata as a fallback
 * until the CRM customer row exists.
 *
 * Missing / unknown → treat as opted in (legacy members + booking default).
 */
export function membershipCustomerSmsOptedIn(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return true;
  }
  const value = (metadata as Record<string, unknown>).smsOptIn;
  if (value === false || value === 'false') return false;
  return true;
}
