import {
  serviceLinkEmailDetailRow,
  serviceLinkEmailSection,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';
import type { MembershipCanceledEmailPayload } from './types';

function businessLabel(businessName: string): string {
  return businessName.trim() || 'your provider';
}

function planLabel(planName: string): string {
  return planName.trim() || 'your plan';
}

function greetingName(customerName: string | null | undefined): string | null {
  const name = customerName?.trim();
  return name || null;
}

function formatAccessDate(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const date = new Date(iso.trim());
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getMembershipCanceledEmailSubject(
  businessName: string
): string {
  return `Your subscription with ${businessLabel(businessName)} is canceled`;
}

function bodyCopy(payload: MembershipCanceledEmailPayload): string {
  const business = businessLabel(payload.businessName);
  const plan = planLabel(payload.planName);
  const hello = greetingName(payload.customerName);
  const lead = hello ? `Hi ${hello},` : 'Hi,';
  const accessUntil = formatAccessDate(payload.accessUntilIso);

  if (payload.kind === 'at_period_end' && accessUntil) {
    return `${lead} your ${plan} subscription with ${business} is canceled. You’ll keep access until ${accessUntil}.`;
  }
  if (payload.kind === 'at_period_end') {
    return `${lead} your ${plan} subscription with ${business} is canceled. You’ll keep access through the end of your current billing period.`;
  }
  return `${lead} your ${plan} subscription with ${business} has been canceled.`;
}

export function buildMembershipCanceledEmailPlainText(
  payload: MembershipCanceledEmailPayload
): string {
  const business = businessLabel(payload.businessName);
  const plan = planLabel(payload.planName);
  const accessUntil = formatAccessDate(payload.accessUntilIso);

  const lines = [
    'Subscription canceled',
    '',
    bodyCopy(payload),
    '',
    `Plan: ${plan}`,
  ];
  if (payload.kind === 'at_period_end' && accessUntil) {
    lines.push(`Access until: ${accessUntil}`);
  }
  lines.push('', `Sent for ${business} via ServiceLink`);
  return lines.join('\n');
}

export function buildMembershipCanceledEmailHtml(
  payload: MembershipCanceledEmailPayload
): string {
  const business = businessLabel(payload.businessName);
  const plan = planLabel(payload.planName);
  const accessUntil = formatAccessDate(payload.accessUntilIso);
  const year = new Date().getFullYear();

  const detailRows = [
    serviceLinkEmailDetailRow('Plan', plan, {
      isLast: !(payload.kind === 'at_period_end' && accessUntil),
    }),
  ];
  if (payload.kind === 'at_period_end' && accessUntil) {
    detailRows.push(
      serviceLinkEmailDetailRow('Access until', accessUntil, { isLast: true })
    );
  }

  return wrapServiceLinkEmail({
    title: 'Subscription canceled',
    heading: 'Subscription canceled',
    subtitle: bodyCopy(payload),
    bodyHtml: serviceLinkEmailSection('Details', detailRows.join('')),
    footerHtml: `Sent for ${business} via ServiceLink.<br>&copy; ${year} ServiceLink.`,
  });
}
