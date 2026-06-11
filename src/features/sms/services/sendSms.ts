/**
 * Best-effort SMS send via Pingram. Never throws: failures are logged and
 * returned as a result so callers (booking flows, cron) can continue. Mirrors
 * how owner email/push sends are treated as non-blocking side effects.
 */

import { ChannelsEnum } from 'pingram';
import { logSms } from '../server/smsLog';
import { toE164 } from '../utils/toE164';
import { getPingramClient, getPingramFromNumber } from './pingramClient';

export interface SendSmsParams {
  /** Raw or E.164 phone number. Normalized internally; invalid numbers are skipped. */
  to: string | null | undefined;
  /** Message body. Keep concise; opt-out language is provided by templates. */
  message: string;
  /**
   * Pingram notification "type" id (groups messages in the dashboard, e.g.
   * `booking_confirmation`, `booking_reminder`). Created on first use.
   */
  type: string;
  /**
   * Stable recipient identifier for Pingram (`to.id`, required by the API).
   * Defaults to the normalized phone number when omitted.
   */
  recipientId?: string;
  /** Optional request id for log correlation. */
  correlationId?: string;
}

export type SendSmsResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' | 'invalid_number' | 'error' };

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { type, message, correlationId } = params;

  const number = toE164(params.to);
  if (!number) {
    logSms(correlationId, 'info', 'skip_invalid_number', { type });
    return { sent: false, reason: 'invalid_number' };
  }

  const client = getPingramClient();
  if (!client) {
    logSms(correlationId, 'warn', 'skip_not_configured', { type });
    return { sent: false, reason: 'not_configured' };
  }

  const from = getPingramFromNumber();

  try {
    await client.send({
      type,
      to: { id: params.recipientId?.trim() || number, number },
      forceChannels: [ChannelsEnum.SMS],
      sms: { message, ...(from ? { from } : {}) },
    });
    logSms(correlationId, 'info', 'sent', { type });
    return { sent: true };
  } catch (e) {
    logSms(correlationId, 'warn', 'send_failed', {
      type,
      error: e instanceof Error ? e.message.slice(0, 200) : String(e),
    });
    return { sent: false, reason: 'error' };
  }
}
