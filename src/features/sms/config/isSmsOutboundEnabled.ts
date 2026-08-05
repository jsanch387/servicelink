/**
 * Master switch for outbound customer SMS.
 *
 * Hardcoded on purpose (no env var). Flip to `false` to kill all customer SMS
 * in one place. Pro eligibility is enforced in `canBusinessSendCustomerSms`
 * (optional email allowlist only if `SMS_ROLLOUT_OWNER_EMAILS` is non-empty).
 *
 * @see smsRolloutAllowlist.ts
 * @see canBusinessSendCustomerSms
 */
export const SMS_OUTBOUND_ENABLED = true;

export function isSmsOutboundEnabled(): boolean {
  return SMS_OUTBOUND_ENABLED;
}
