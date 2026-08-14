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
  return `Book your next visit with ${businessLabel(businessName)}`;
}

function reminderBodyCopy(payload: MembershipVisitReminderPayload): string {
  const business = businessLabel(payload.businessName);
  const plan = planLabel(payload.planName);
  const hello = greetingName(payload.customerName);
  const lead = hello ? `Hi ${hello}, a` : 'A';
  return `${lead} new period of ${plan} with ${business} started. Choose a date and time that works for you.`;
}

export function buildMembershipVisitReminderPlainText(
  payload: MembershipVisitReminderPayload
): string {
  const business = businessLabel(payload.businessName);

  return [
    'Book your next visit',
    '',
    reminderBodyCopy(payload),
    '',
    'Choose a date:',
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
    title: 'Book your next visit',
    heading: 'Book your next visit',
    subtitle: reminderBodyCopy(payload),
    bodyHtml: serviceLinkEmailCta(payload.scheduleUrl.trim(), 'Choose a date'),
    footerHtml: `Sent for ${business} via ServiceLink.<br>&copy; ${year} ServiceLink.`,
  });
}
