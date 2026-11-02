import { GOOGLE_PLAY_STORE_URL, IOS_APP_STORE_URL } from '@/constants/appStore';
import { MARKETING_SOCIAL } from '@/constants/marketingSocial';
import {
  SERVICELINK_LEGAL_NAME,
  SERVICELINK_SUPPORT_EMAIL,
  SERVICELINK_SUPPORT_MAILTO,
} from '@/constants/support';

import { escapeHtml } from '../utils/escapeHtml';
import type { WelcomeLiveEmailPayload } from './types';

export const WELCOME_LIVE_SUBJECT = '🚀 Your business is live';

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Inline image ids. The send path attaches the matching PNGs so inboxes do not fetch them from the site. */
export const WELCOME_INSTAGRAM_CID = 'welcome-instagram';
export const WELCOME_APP_STORE_CID = 'welcome-app-store';

const INSTAGRAM_ICON_URL = `cid:${WELCOME_INSTAGRAM_CID}`;

function emojiIcon(symbol: string): string {
  return `<span style="display:block;width:32px;height:32px;line-height:32px;font-size:16px;text-align:center;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:8px;">${symbol}</span>`;
}

const SITE = 'https://myservicelink.app';

function storeBadge(
  href: string,
  src: string,
  alt: string,
  width: number,
  height: number
): string {
  return `<a href="${escapeHtml(href)}" style="text-decoration:none;"><img src="${escapeHtml(src)}" width="${width}" height="${height}" alt="${escapeHtml(alt)}" style="display:block;border:0;outline:none;text-decoration:none;width:${width}px;height:${height}px;" /></a>`;
}

function welcomeLiveFooter(): string {
  const year = new Date().getFullYear();
  const linkStyle = `font-family:${FONT};font-size:12px;line-height:18px;color:#71717a;text-decoration:none;`;

  return `
    <tr>
      <td align="center" style="padding: 28px 12px 8px; text-align: center; font-family: ${FONT};">
        <p style="margin: 0 0 12px; font-size: 13px; line-height: 18px; color: #71717a;">
          Get the app
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" align="center">
          <tr>
            <td style="padding-right: 8px;">
              ${storeBadge(IOS_APP_STORE_URL, `cid:${WELCOME_APP_STORE_CID}`, 'Download on the App Store', 120, 40)}
            </td>
            <td>
              ${storeBadge(GOOGLE_PLAY_STORE_URL, `${SITE}/store/google-play.png`, 'Get it on Google Play', 135, 40)}
            </td>
          </tr>
        </table>
        <p style="margin: 18px 0 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">
          &copy; ${year} ${escapeHtml(SERVICELINK_LEGAL_NAME)}
        </p>
        <p style="margin: 6px 0 0; font-size: 12px; line-height: 18px;">
          <a href="${SITE}/privacy" style="${linkStyle}">Privacy</a>
          <span style="color: #d4d4d8;"> &nbsp;&middot;&nbsp; </span>
          <a href="${SITE}/terms" style="${linkStyle}">Terms</a>
          <span style="color: #d4d4d8;"> &nbsp;&middot;&nbsp; </span>
          <a href="${escapeHtml(SERVICELINK_SUPPORT_MAILTO)}" style="${linkStyle}">${escapeHtml(SERVICELINK_SUPPORT_EMAIL)}</a>
        </p>
      </td>
    </tr>`;
}

/** Light tile is part of the image so dark mode cannot turn the mark black-on-black. */
function instagramIcon(): string {
  return `<img src="${escapeHtml(INSTAGRAM_ICON_URL)}" width="32" height="32" alt="" style="display:block;border:0;outline:none;text-decoration:none;width:32px;height:32px;border-radius:8px;" />`;
}

export function buildWelcomeLiveHtml(payload: WelcomeLiveEmailPayload): string {
  const profileUrl = `https://myservicelink.app/${encodeURIComponent(payload.businessSlug.trim())}`;
  const safeUrl = escapeHtml(profileUrl);
  const instagramUrl = escapeHtml(MARKETING_SOCIAL.instagramUrl);
  const instagramHandle = escapeHtml(MARKETING_SOCIAL.instagramHandle);

  const shareItem = (icon: string, title: string, idea: string) => `
    <tr>
      <td style="padding: 0 0 8px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px;">
          <tr>
            <td width="52" valign="middle" style="width: 52px; padding: 12px 0 12px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" valign="middle" style="font-family: ${FONT}; font-size: 0; line-height: 0; text-align: center;">
                    ${icon}
                  </td>
                </tr>
              </table>
            </td>
            <td valign="middle" style="padding: 12px 14px 12px 10px; font-family: ${FONT};">
              <p style="margin: 0; font-size: 15px; line-height: 20px; font-weight: 600; color: #18181b;">${title}</p>
              <p style="margin: 2px 0 0; font-size: 13px; line-height: 18px; color: #71717a;">${idea}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${WELCOME_LIVE_SUBJECT}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: ${FONT}; color: #18181b;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px;">
          <tr>
            <td style="background-color: #0a0a0a; border-radius: 16px 16px 0 0; padding: 28px 28px 24px;">
              <p style="margin: 0 0 10px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #a1a1aa; font-weight: 600;">ServiceLink</p>
              <h1 style="margin: 0; font-size: 28px; line-height: 1.2; color: #ffffff; font-weight: 600;">
                You're live
              </h1>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; border-radius: 0 0 16px 16px; border: 1px solid #e4e4e7; border-top: 0; padding: 28px;">
              <p style="margin: 0 0 22px; font-size: 16px; line-height: 1.5; color: #3f3f46;">
                Congratulations. Your booking page is ready for customers.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 28px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px;">
                <tr>
                  <td style="padding: 14px 16px 4px; font-family: ${FONT}; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #71717a;">
                    Your link
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 16px 14px; font-family: ${FONT}; font-size: 15px; line-height: 22px; font-weight: 600; word-break: break-word;">
                    <a href="${safeUrl}" style="color: #18181b; text-decoration: none;">${safeUrl}</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #18181b;">
                See what customers see
              </p>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #3f3f46;">
                Schedule an appointment for yourself. You will go through the same page, services, and times your customers see, so you can experience the full system.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 28px;">
                <tr>
                  <td style="border-radius: 10px; background-color: #0a0a0a;">
                    <a href="${safeUrl}" style="display: inline-block; padding: 12px 18px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; font-family: ${FONT};">
                      Schedule an appointment
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #18181b;">
                Share the link
              </p>
              <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.5; color: #3f3f46;">
                A few places that usually bring the first bookings.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 22px;">
                ${shareItem(emojiIcon('👥'), 'Facebook groups and Nextdoor', 'Post a before-and-after and put your link under it.')}
                ${shareItem(instagramIcon(), 'Instagram bio', 'Swap “DM for price” for your link.')}
                ${shareItem(emojiIcon('📍'), 'Google Business profile', 'Add the link so people can book from Google.')}
                ${shareItem(emojiIcon('💬'), 'A text to past customers', 'Send it to a few people you already worked with.')}
              </table>

              <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #18181b;">
                Create your first post on social media
              </p>
              <p style="margin: 0 0 24px; padding: 14px 16px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; font-size: 14px; line-height: 1.55; color: #27272a;">
                Before and after from today. A couple openings this week. Book here:
                <a href="${safeUrl}" style="color: #18181b; font-weight: 600; text-decoration: none;">${safeUrl}</a>
              </p>

              <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.5; color: #71717a;">
                Reply to this email if you want help with the first booking.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #f4f4f5;">
                <tr>
                  <td style="padding-top: 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="32" valign="middle" style="width: 32px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" valign="middle" width="32" height="32" style="width: 32px; height: 32px; font-size: 0; line-height: 0; text-align: center; vertical-align: middle;">
                                ${instagramIcon()}
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left: 10px; font-family: ${FONT};">
                          <a href="${instagramUrl}" style="font-size: 14px; line-height: 20px; font-weight: 600; color: #18181b; text-decoration: none;">
                            Follow us on Instagram
                          </a>
                          <p style="margin: 1px 0 0; font-size: 13px; line-height: 18px; color: #71717a;">@${instagramHandle}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${welcomeLiveFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}
