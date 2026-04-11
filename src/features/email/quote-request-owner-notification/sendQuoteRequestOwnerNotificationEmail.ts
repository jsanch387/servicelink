/**
 * Sends the “new quote request” email to the business owner.
 * Best-effort from the public quote-request API; failures are logged by the caller.
 */

import { ROUTES } from '@/constants/routes';
import {
  getAppBaseUrl,
  getFromEmail,
  getResendClient,
} from '../services/resendClient';
import {
  buildQuoteRequestOwnerNotificationHtml,
  getQuoteRequestOwnerNotificationSubject,
} from './quoteRequestOwnerNotificationTemplate';
import type {
  QuoteRequestOwnerNotificationPayload,
  SendQuoteRequestOwnerNotificationResult,
} from './types';

export async function sendQuoteRequestOwnerNotificationEmail(
  to: string,
  payload: QuoteRequestOwnerNotificationPayload
): Promise<SendQuoteRequestOwnerNotificationResult> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const baseUrl = getAppBaseUrl();
  const dashboardUrl = `${baseUrl}${ROUTES.DASHBOARD.QUOTES_REQUESTS}`;
  const subject = getQuoteRequestOwnerNotificationSubject(payload.customerName);
  const html = buildQuoteRequestOwnerNotificationHtml(payload, dashboardUrl);

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
