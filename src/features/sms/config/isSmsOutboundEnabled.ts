/**
 * Master switch for outbound customer SMS.
 *
 * Set `SMS_OUTBOUND_ENABLED=true` when the SMS provider (Telnyx) and sender
 * setup are ready. Until then, callers still run their normal flow but no
 * texts are sent (response reports `not_configured`).
 */
export function isSmsOutboundEnabled(): boolean {
  return process.env.SMS_OUTBOUND_ENABLED?.trim().toLowerCase() === 'true';
}
