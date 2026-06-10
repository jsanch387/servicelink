/**
 * Sends the "Welcome to Pro" email after a user's first paid Pro upgrade.
 * Best-effort: the caller logs failures and never rolls back the Pro upgrade.
 * The one-time guard lives in `sendProWelcomeIfFirstPaidPro` (atomic DB claim).
 */

import { ROUTES } from '@/constants/routes';

import {
  getAppBaseUrl,
  getFromEmail,
  getResendClient,
} from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  PRO_WELCOME_SUBJECT,
  buildProWelcomeHtml,
  buildProWelcomePlainText,
} from './proWelcomeTemplate';
import type { SendProWelcomeEmailResult } from './types';

export async function sendProWelcomeEmail(
  to: string,
  params: { firstName?: string } = {}
): Promise<SendProWelcomeEmailResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const workshopUrl = `${getAppBaseUrl()}${ROUTES.WORKSHOP}`;
  const payload = { firstName: params.firstName, workshopUrl };
  const html = buildProWelcomeHtml(payload);
  const text = buildProWelcomePlainText(payload);

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [recipient],
    subject: PRO_WELCOME_SUBJECT,
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
