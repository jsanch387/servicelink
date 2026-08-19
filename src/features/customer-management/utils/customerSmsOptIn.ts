/**
 * `customers.sms_opt_in` — transactional SMS preference.
 * Missing / null → treated as opted in (legacy rows + checkbox default).
 */
export function customerSmsOptedIn(smsOptIn: unknown): boolean {
  if (smsOptIn === false || smsOptIn === 'false') return false;
  return true;
}
