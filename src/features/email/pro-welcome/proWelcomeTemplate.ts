import {
  SERVICELINK_SUPPORT_EMAIL,
  SERVICELINK_SUPPORT_MAILTO,
} from '@/constants/support';

import { escapeHtml } from '../utils/escapeHtml';
import type { ProWelcomeEmailPayload } from './types';

export const PRO_WELCOME_SUBJECT = 'Welcome to ServiceLink Pro';

export function buildProWelcomeHtml(payload: ProWelcomeEmailPayload): string {
  const workshopUrl = escapeHtml(payload.workshopUrl.trim());

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${PRO_WELCOME_SUBJECT}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          <tr>
            <td style="background-color: #0a0a0a; border-radius: 16px 16px 0 0; padding: 30px 30px 26px;">
              <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; color: #a1a1aa; font-weight: 700;">ServiceLink</p>
              <h1 style="margin: 0; font-size: 30px; line-height: 1.2; color: #ffffff; font-weight: 800;">
                Welcome to Pro.
              </h1>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; border-radius: 0 0 16px 16px; border: 1px solid #e4e4e7; border-top: 0; padding: 30px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.65; color: #18181b;">
                Hey there!
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.65; color: #3f3f46;">
                You just upgraded to ServiceLink Pro — thank you. I am the founder, and I want
                to make sure you get a real return on this, not just a nicer booking page.
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.65; color: #3f3f46;">
                The fastest way to fill your calendar is paid ads pointed at your booking link.
                I recorded a short Meta ads workshop that walks through exactly how to do it — and
                where ServiceLink turns those ad clicks into booked jobs.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 26px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <p style="margin: 0 0 10px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #71717a;">In the workshop</p>
                    <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #3f3f46;">Local Meta ad targeting that reaches customers near you</p>
                    <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #3f3f46;">Simple video creatives that actually get clicks</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #3f3f46;">Sending ad traffic to your ServiceLink link instead of your DMs</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 26px;">
                <tr>
                  <td style="border-radius: 10px; background-color: #0a0a0a;">
                    <a href="${workshopUrl}" style="display: inline-block; padding: 14px 26px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none;">
                      Watch the Meta ads workshop
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.65; color: #71717a;">
                Or paste this into your browser:<br>
                <a href="${workshopUrl}" style="color: #18181b; text-decoration: underline; word-break: break-word;">${workshopUrl}</a>
              </p>

              <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 0 0 22px;">

              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #3f3f46;">
                Watch it when you have 20 minutes, then run your first campaign. If you get stuck
                or want a second set of eyes on your ad, just shoot us an email at
                <a href="${SERVICELINK_SUPPORT_MAILTO}" style="color: #18181b; text-decoration: underline;">${SERVICELINK_SUPPORT_EMAIL}</a>.
              </p>

              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #18181b;">
                Stay shining,<br>
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

export function buildProWelcomePlainText(
  payload: ProWelcomeEmailPayload
): string {
  return [
    'Hey there!',
    '',
    'You just upgraded to ServiceLink Pro — thank you. I am the founder, and I want to make sure you get a real return on this.',
    '',
    'The fastest way to fill your calendar is paid ads pointed at your booking link. I recorded a short Meta ads workshop that shows exactly how to do it, and where ServiceLink turns those ad clicks into booked jobs.',
    '',
    'In the workshop:',
    '- Local Meta ad targeting that reaches customers near you',
    '- Simple video creatives that actually get clicks',
    '- Sending ad traffic to your ServiceLink link instead of your DMs',
    '',
    `Watch it here: ${payload.workshopUrl.trim()}`,
    '',
    `Watch it when you have 20 minutes, then run your first campaign. If you get stuck or want a second set of eyes on your ad, just shoot us an email at ${SERVICELINK_SUPPORT_EMAIL}.`,
    '',
    'Stay shining,',
    'ServiceLink Founder',
  ].join('\n');
}
