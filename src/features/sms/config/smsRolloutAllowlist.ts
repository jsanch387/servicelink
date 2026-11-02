/**
 * Temporary SMS rollout allowlist (owner auth emails, lowercase).
 *
 * While this list is non-empty, only businesses whose owner email is listed
 * may send customer SMS. Empty = all owners, Free and Pro (current production state).
 *
 * @see canBusinessSendCustomerSms
 */
export const SMS_ROLLOUT_OWNER_EMAILS: readonly string[] = [];

export function isSmsRolloutAllowlistActive(): boolean {
  return SMS_ROLLOUT_OWNER_EMAILS.length > 0;
}

export function isOwnerEmailAllowedForSmsRollout(
  email: string | null | undefined
): boolean {
  if (!isSmsRolloutAllowlistActive()) return true;
  const normalized = email?.trim().toLowerCase() ?? '';
  if (!normalized) return false;
  return SMS_ROLLOUT_OWNER_EMAILS.some(e => e.toLowerCase() === normalized);
}
