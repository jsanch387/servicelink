/**
 * Sends the quote link to the customer after the owner creates/sends a quote.
 * Best-effort: failures are logged by the caller; quote + link are never rolled back.
 */

import { getFromEmail, getResendClient } from '../services/resendClient';
import {
  buildQuoteSentToCustomerHtml,
  getQuoteSentToCustomerSubject,
} from './quoteSentToCustomerTemplate';
import type {
  QuoteSentToCustomerPayload,
  SendQuoteSentToCustomerResult,
} from './types';

export async function sendQuoteSentToCustomerEmail(
  to: string,
  payload: QuoteSentToCustomerPayload
): Promise<SendQuoteSentToCustomerResult> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getQuoteSentToCustomerSubject(payload.businessName);
  const html = buildQuoteSentToCustomerHtml(payload);

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [to.trim()],
    subject,
    html,
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }
  return { sent: true };
}
