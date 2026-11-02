/**
 * One-time nudge after a sent quote sits unanswered. Same `/q/` link as the SMS.
 */

import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildQuoteCustomerReminderHtml,
  buildQuoteCustomerReminderPlainText,
  getQuoteCustomerReminderSubject,
} from './quoteCustomerReminderTemplate';
import type {
  QuoteCustomerReminderPayload,
  SendQuoteCustomerReminderResult,
} from './types';

export async function sendQuoteCustomerReminderEmail(
  to: string,
  payload: QuoteCustomerReminderPayload
): Promise<SendQuoteCustomerReminderResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const publicQuoteUrl = payload.publicQuoteUrl.trim();
  if (!publicQuoteUrl) {
    return { sent: false, error: 'Missing public quote URL' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getQuoteCustomerReminderSubject(payload.businessName);
  const html = buildQuoteCustomerReminderHtml({
    ...payload,
    publicQuoteUrl,
  });
  const text = buildQuoteCustomerReminderPlainText({
    ...payload,
    publicQuoteUrl,
  });

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [recipient],
    subject,
    html,
    text,
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }
  return { sent: true };
}
