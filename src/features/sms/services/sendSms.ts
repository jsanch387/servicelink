/**
 * Best-effort SMS send. Never throws: failures are logged and returned as a
 * result so callers (booking flows, cron) can continue. Mirrors how owner
 * email/push sends are treated as non-blocking side effects.
 *
 * Provider: none wired yet. Telnyx integration will plug in here. Until then
 * every call returns `not_configured`.
 */

import { logSms } from '../server/smsLog';
import { toE164 } from '../utils/toE164';

export interface SendSmsParams {
  /** Raw or E.164 phone number. Normalized internally; invalid numbers are skipped. */
  to: string | null | undefined;
  /** Message body. Keep concise; opt-out language is provided by templates. */
  message: string;
  /** Logical message type for logs (e.g. `booking_confirmation`, `on_the_way`). */
  type: string;
  /** Optional request id for log correlation. */
  correlationId?: string;
}

export type SendSmsResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' | 'invalid_number' | 'error' };

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { type, correlationId } = params;

  const number = toE164(params.to);
  if (!number) {
    logSms(correlationId, 'info', 'skip_invalid_number', { type });
    return { sent: false, reason: 'invalid_number' };
  }

  // No SMS provider configured yet — Telnyx will replace this branch.
  logSms(correlationId, 'warn', 'skip_not_configured', { type });
  return { sent: false, reason: 'not_configured' };
}
