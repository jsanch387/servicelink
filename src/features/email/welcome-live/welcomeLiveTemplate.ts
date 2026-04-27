import { escapeHtml } from '../utils/escapeHtml';
import type { WelcomeLiveEmailPayload } from './types';

export const WELCOME_LIVE_SUBJECT = '🚀 Your business is officially LIVE!';

export function buildWelcomeLiveHtml(payload: WelcomeLiveEmailPayload): string {
  const canonicalProfileUrl = `https://myservicelink.app/${encodeURIComponent(payload.businessSlug.trim())}`;
  const safeBookingUrl = escapeHtml(canonicalProfileUrl);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${WELCOME_LIVE_SUBJECT}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px;">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #111827 100%); border-radius: 18px 18px 0 0; padding: 28px 28px 22px;">
              <p style="margin: 0 0 10px; font-size: 18px; line-height: 1.2; color: #e5e7eb; font-weight: 700;">ServiceLink</p>
              <h1 style="margin: 0; font-size: 32px; line-height: 1.2; color: #ffffff;">
                🚀 Your business is officially LIVE!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; border-radius: 0 0 18px 18px; border: 1px solid #e4e4e7; border-top: 0; padding: 28px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.65;">
                Welcome to the family! I am the ServiceLink founder and I am hyped to have you on the platform.
                Your professional booking page is officially live and ready to take orders.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px; border: 1px solid #bfdbfe; background-color: #eff6ff; border-radius: 12px;">
                <tr>
                  <td style="padding: 14px 16px 6px; font-size: 14px; font-weight: 700; color: #1d4ed8;">
                    Your booking link
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 16px 14px; word-break: break-word;">
                    <a href="${safeBookingUrl}" style="font-size: 17px; font-weight: 700; color: #111827; text-decoration: none;">${safeBookingUrl}</a>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="border-radius: 10px; background-color: #18181b;">
                    <a href="${safeBookingUrl}" style="display: inline-block; padding: 12px 18px; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;">
                      View your live page
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 22px; font-size: 15px; line-height: 1.65; color: #3f3f46;">
                Take a second to feel good about that. You have officially leveled up.
                You are running a business with a high-performance operating system now.
              </p>

              <h2 style="margin: 0 0 14px; font-size: 21px; line-height: 1.3; color: #111827;">
                How to dominate your local area starting today
              </h2>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 14px; border: 1px solid #e4e4e7; border-radius: 12px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #111827;">1) Put your link to work</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #3f3f46;">
                      Do not wait for people to find you. Put your ServiceLink URL in your Instagram bio, your Facebook Page, and your Google Business profile.
                      When a customer can book you in 30 seconds without a phone call, you win.
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 18px; border: 1px solid #e4e4e7; border-radius: 12px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #111827;">2) The "Satisfying" strategy</p>
                    <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.65; color: #3f3f46;">
                      Post a before-and-after photo in your neighborhood Facebook group or Nextdoor.
                      Instead of saying "DM me for prices," try this:
                    </p>
                    <p style="margin: 0; padding: 10px 12px; background-color: #fafafa; border-left: 4px solid #2563eb; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #27272a;">
                      "I have 2 slots left this Friday. See my prices and grab a spot here:
                      <a href="${safeBookingUrl}" style="color: #1d4ed8; text-decoration: none;">${safeBookingUrl}</a>"
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #3f3f46;">
                I am stoked to see you grow this thing. If you need anything at all, or want to shout out your first booking, hit reply and let me know.
              </p>

              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #18181b;">
                Stay Shining,<br>
                <strong>ServiceLink Founder</strong>
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
