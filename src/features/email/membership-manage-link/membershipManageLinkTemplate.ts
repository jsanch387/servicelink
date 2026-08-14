import {
  serviceLinkEmailCta,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';
import type { MembershipManageLinkPayload } from './types';

function businessLabel(businessName: string): string {
  return businessName.trim() || 'your provider';
}

function planLabel(planName: string): string {
  return planName.trim() || 'your plan';
}

export function getMembershipManageLinkSubject(businessName: string): string {
  return `Manage your subscription — ${businessLabel(businessName)}`;
}

function manageBodyCopy(payload: MembershipManageLinkPayload): string {
  const business = businessLabel(payload.businessName);
  const plan = planLabel(payload.planName);
  const hello = payload.customerName?.trim()
    ? `Hi ${payload.customerName.trim()},`
    : 'Hi,';
  return `${hello} use the button below to manage or cancel ${plan} with ${business}.`;
}

export function buildMembershipManageLinkPlainText(
  payload: MembershipManageLinkPayload
): string {
  const business = businessLabel(payload.businessName);

  return [
    'Manage your plan',
    '',
    manageBodyCopy(payload),
    '',
    payload.manageUrl.trim(),
    '',
    'If you didn’t request this, you can ignore this email.',
    '',
    `Sent for ${business} via ServiceLink`,
  ].join('\n');
}

export function buildMembershipManageLinkHtml(
  payload: MembershipManageLinkPayload
): string {
  const business = businessLabel(payload.businessName);
  const year = new Date().getFullYear();

  return wrapServiceLinkEmail({
    title: 'Manage your plan',
    heading: 'Manage your plan',
    subtitle: manageBodyCopy(payload),
    bodyHtml: `${serviceLinkEmailCta(payload.manageUrl.trim(), 'Manage or cancel')}
      <p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#737373;">
        If you didn’t request this, you can ignore this email.
      </p>`,
    footerHtml: `Sent for ${business} via ServiceLink.<br>&copy; ${year} ServiceLink.`,
  });
}
