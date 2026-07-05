/**
 * Shared outcome when outbound SMS is intentionally paused at a call site.
 *
 * @see docs/sms-outbound-paused.md
 */

export const SMS_OUTBOUND_PAUSED_DOC = 'docs/sms-outbound-paused.md';

export type SmsPausedReason = 'not_configured';

/** Response shape for API routes that report `sms` alongside job transitions. */
export function pausedSmsChannelOutcome(): {
  sent: false;
  messageId: null;
  reason: SmsPausedReason;
} {
  return { sent: false, messageId: null, reason: 'not_configured' };
}
