import { GOOGLE_PLAY_STORE_URL, IOS_APP_STORE_URL } from '@/constants/appStore';
import {
  SERVICELINK_LEGAL_NAME,
  SERVICELINK_SUPPORT_EMAIL,
  SERVICELINK_SUPPORT_MAILTO,
} from '@/constants/support';

import { escapeHtml } from './utils/escapeHtml';

/** Same content id the you’re-live email attaches for the App Store badge. */
export const APP_STORE_BADGE_CID = 'welcome-app-store';

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

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

/** “Get the app” row shared with the you’re-live email. */
export function buildAppDownloadFooterRow(year: number): string {
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
              ${storeBadge(IOS_APP_STORE_URL, `cid:${APP_STORE_BADGE_CID}`, 'Download on the App Store', 120, 40)}
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
