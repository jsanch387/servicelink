/**
 * Master switch for outbound customer SMS.
 *
 * Hardcoded on purpose (no env var). Flip to `false` to kill all customer SMS
 * in one place. While `SMS_ROLLOUT_OWNER_EMAILS` is non-empty, only listed Pro
 * owners can send; clear that allowlist to open SMS to all Pro owners.
 *
 * @see smsRolloutAllowlist.ts
 * @see canBusinessSendCustomerSms
 */
export const SMS_OUTBOUND_ENABLED = true;

export function isSmsOutboundEnabled(): boolean {
  return SMS_OUTBOUND_ENABLED;
}
