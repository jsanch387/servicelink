import { escapeHtml } from '../utils/escapeHtml';
import {
  serviceLinkEmailCta,
  serviceLinkEmailDetailRow,
  serviceLinkEmailSection,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';
import type { TeamInviteEmailPayload } from './types';

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MUTED = `margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:#737373;`;

function shopName(businessName: string): string {
  return businessName.trim() || 'the shop';
}

function personName(recipientName: string): string {
  return recipientName.trim() || 'Team member';
}

function expiryLabel(days: number): string {
  const count = Number.isFinite(days) && days > 0 ? Math.round(days) : 14;
  return count === 1 ? '1 day' : `${count} days`;
}

function bodyCopy(payload: TeamInviteEmailPayload): string {
  const business = shopName(payload.businessName);
  const name = payload.recipientName.trim();
  const hello = name ? `Hi ${name},` : 'Hi,';
  return `${hello} ${business} added you to their team. Open the link below to access your account. The link expires in ${expiryLabel(payload.expiresInDays)}.`;
}

export function getTeamInviteEmailSubject(businessName: string): string {
  return `${shopName(businessName)} added you to their team`;
}

export function buildTeamInviteEmailPlainText(
  payload: TeamInviteEmailPayload
): string {
  const business = shopName(payload.businessName);
  const name = personName(payload.recipientName);
  const expires = expiryLabel(payload.expiresInDays);

  return [
    'Added to the team',
    '',
    bodyCopy(payload),
    '',
    `Name: ${name}`,
    `Shop: ${business}`,
    `Link expires: ${expires}`,
    '',
    'Open this link to access your account:',
    payload.inviteUrl.trim(),
    '',
    'If you were not expecting this, you can ignore this email.',
    '',
    `Sent for ${business} via ServiceLink`,
  ].join('\n');
}

export function buildTeamInviteEmailHtml(
  payload: TeamInviteEmailPayload
): string {
  const business = shopName(payload.businessName);
  const name = personName(payload.recipientName);
  const expires = expiryLabel(payload.expiresInDays);
  const inviteUrl = payload.inviteUrl.trim();
  const safeUrl = escapeHtml(inviteUrl);
  const year = new Date().getFullYear();

  const details = [
    serviceLinkEmailDetailRow('Name', name),
    serviceLinkEmailDetailRow('Shop', business),
    serviceLinkEmailDetailRow('Link expires', expires, { isLast: true }),
  ].join('');

  return wrapServiceLinkEmail({
    title: 'Added to the team',
    heading: 'Added to the team',
    subtitle: bodyCopy(payload),
    bodyHtml: `
      ${serviceLinkEmailSection('Details', details, { isFirst: true })}
      ${serviceLinkEmailCta(inviteUrl, 'Open team access')}
      <p style="${MUTED}word-break:break-all;">
        <a href="${safeUrl}" style="color:#a3a3a3;text-decoration:underline;">${safeUrl}</a>
      </p>
      <p style="${MUTED}">
        If you were not expecting this, you can ignore this email.
      </p>
    `,
    footerHtml: `Sent for ${escapeHtml(business)} via ServiceLink.<br>&copy; ${year} ServiceLink.`,
  });
}
