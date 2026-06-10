/**
 * Sends the "subscription payment failed" email (Resend).
 * Wired to the Stripe `invoice.payment_failed` webhook via `notifyPaymentFailedOnce`
 * (`@/features/pricing/server`), which guarantees one email per failure episode
 * (no spam across Stripe's automatic retries). Best-effort: the caller logs failures.
 */

import { ROUTES } from '@/constants/routes';
import {
  SERVICELINK_SUPPORT_EMAIL,
  SERVICELINK_SUPPORT_MAILTO,
} from '@/constants/support';
import {
  getAppBaseUrl,
  getFromEmail,
  getResendClient,
} from '../services/resendClient';
import type { SendSubscriptionPaymentFailedResult } from './types';

const SUBJECT = 'Your ServiceLink Pro payment failed — update your card';

function buildHtml(settingsUrl: string): string {
  const safeSettingsUrl = settingsUrl;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SUBJECT}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          <tr>
            <td style="background-color: #0a0a0a; border-radius: 16px 16px 0 0; padding: 30px 30px 26px;">
              <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; color: #a1a1aa; font-weight: 700;">ServiceLink</p>
              <h1 style="margin: 0; font-size: 28px; line-height: 1.2; color: #ffffff; font-weight: 800;">
                Your payment didn't go through.
              </h1>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; border-radius: 0 0 16px 16px; border: 1px solid #e4e4e7; border-top: 0; padding: 30px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.65; color: #18181b;">
                Hey there!
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.65; color: #3f3f46;">
                We tried to charge your card for ServiceLink Pro, but it didn't go through.
                No big deal — it's a quick fix.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #18181b;">
                      What happens if it isn't updated
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #3f3f46;">
                      Your account moves back to the <strong style="color: #18181b;">Free plan</strong>, and
                      <strong style="color: #18181b;">customers won't be able to book through your link</strong>.
                      Updating your card keeps everything running.
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="border-radius: 10px; background-color: #0a0a0a;">
                    <a href="${safeSettingsUrl}" style="display: inline-block; padding: 14px 26px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none;">
                      Update payment method
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #71717a;">
                If you have questions, just shoot us an email at
                <a href="${SERVICELINK_SUPPORT_MAILTO}" style="color: #18181b; text-decoration: underline;">${SERVICELINK_SUPPORT_EMAIL}</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
