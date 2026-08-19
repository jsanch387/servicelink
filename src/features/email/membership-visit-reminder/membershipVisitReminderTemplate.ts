import {
  serviceLinkEmailCta,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';
import type { MembershipVisitReminderPayload } from './types';

function greetingName(customerName: string | null | undefined): string | null {
  const name = customerName?.trim();
  return name || null;
}

function planLabel(planName: string): string {
  return planName.trim() || 'your plan';
}

function businessLabel(businessName: string): string {
  return businessName.trim() || 'your provider';
}

export function getMembershipVisitReminderSubject(
  businessName: string
): string {
  return `Schedule your visit with ${businessLabel(businessName)}`;
}

function reminderBodyCopy(payload: MembershipVisitReminderPayload): string {
  const business = businessLabel(payload.businessName);
  const plan = planLabel(payload.planName);
  const hello = greetingName(payload.customerName);
  const kind = payload.kind ?? 'period_started';

  if (kind === 'schedule_link') {
    const lead = hello ? `Hi ${hello}, your` : 'Your';
    return `${lead} ${plan} with ${business} includes a visit this period. Pick a date and time that works for you.`;
  }

  const lead = hello ? `Hi ${hello}, a` : 'A';
  return `${lead} new period of ${plan} with ${business} started. Schedule your included visit.`;
}

export function buildMembershipVisitReminderPlainText(
  payload: MembershipVisitReminderPayload
): string {
  const business = businessLabel(payload.businessName);

  return [
    'Schedule your visit',
    '',
    reminderBodyCopy(payload),
    '',
    'Schedule visit:',
    payload.scheduleUrl.trim(),
    '',
    `Sent for ${business} via ServiceLink`,
  ].join('\n');
}

export function buildMembershipVisitReminderHtml(
  payload: MembershipVisitReminderPayload
): string {
  const business = businessLabel(payload.businessName);
  const year = new Date().getFullYear();

  return wrapServiceLinkEmail({
    title: 'Schedule your visit',
    heading: 'Schedule your visit',
    subtitle: reminderBodyCopy(payload),
    bodyHtml: serviceLinkEmailCta(payload.scheduleUrl.trim(), 'Schedule visit'),
    footerHtml: `Sent for ${business} via ServiceLink.<br>&copy; ${year} ServiceLink.`,
  });
}
