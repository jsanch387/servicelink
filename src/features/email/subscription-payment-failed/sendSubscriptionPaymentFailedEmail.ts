/**
 * Sends the "subscription payment failed" email when Stripe fires invoice.payment_failed.
 * Asks the user to update their payment method in Settings.
 */

import { ROUTES } from '@/constants/routes';
import {
  getAppBaseUrl,
  getFromEmail,
  getResendClient,
} from '../services/resendClient';
import type { SendSubscriptionPaymentFailedResult } from './types';

const SUBJECT =
  'Action required: Update your payment method for ServiceLink Pro';

function buildHtml(settingsUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 16px;">We couldn’t charge your card for your ServiceLink Pro subscription.</p>
  <p style="margin: 0 0 24px;">Please update your payment method so you don’t lose Pro access. You can manage your subscription and payment method in Settings.</p>
  <p style="margin: 0 0 24px;">
    <a href="${settingsUrl}" style="display: inline-block; background: #171717; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Update payment method</a>
  </p>
  <p style="margin: 0; font-size: 14px; color: #6b7280;">If you have questions, reply to this email or contact support.</p>
</body>
</html>
`.trim();
}

/**
 * Sends the subscription payment failed email to the given address.
 * Returns { sent: true } on success, { sent: false, error } on failure.
 */
export async function sendSubscriptionPaymentFailedEmail(
  to: string
): Promise<SendSubscriptionPaymentFailedResult> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const baseUrl = getAppBaseUrl();
  const settingsUrl = `${baseUrl}${ROUTES.DASHBOARD.SETTINGS}`;
  const html = buildHtml(settingsUrl);

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [to],
    subject: SUBJECT,
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
